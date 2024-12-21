import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, Plus, Menu, ArrowLeft, Edit, Trash } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useBudget } from "./BudgetContext";
import { db } from "@/config/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY!);

type Message = {
  id: string;
  text: string;
  sender: "user" | "advisor";
  timestamp: Date | null;
};

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  createdAt: Date | null;
};

export function ResponsiveChatInterface() {
  const {
    transactions,
    totalBudget,
    remainingBudget,
    savings,
    isLoading: budgetLoading,
  } = useBudget();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialConversationsLoaded, setHasInitialConversationsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingText, setRenamingText] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const conversationsRef = collection(db, "conversations");
    const unsubscribe = onSnapshot(
      query(conversationsRef, orderBy("createdAt", "asc")),
      (snapshot) => {
        const fetchedConversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          lastMessage: doc.data().lastMessage || "",
          unreadCount: doc.data().unreadCount || 0,
          createdAt: doc.data().createdAt?.toDate() || null,
        }));
        setConversations(fetchedConversations);
        setHasInitialConversationsLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (hasInitialConversationsLoaded && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [hasInitialConversationsLoaded, conversations, activeConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      const messagesRef = collection(
        db,
        "conversations",
        activeConversationId,
        "messages"
      );
      const unsubscribe = onSnapshot(
        query(messagesRef, orderBy("timestamp", "asc")),
        (snapshot) => {
          const fetchedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            text: doc.data().text,
            sender: doc.data().sender,
            timestamp: doc.data().timestamp?.toDate() || null,
          }));
          setMessages(fetchedMessages);
        }
      );
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const generateGeminiResponse = useCallback(
    async (userMessage: string) => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const userData = {
        totalBudget,
        remainingBudget,
        savings,
        transactions: transactions.map((t) => ({
          date: new Date(t.date).toLocaleDateString(),
          amount: t.amount,
          title: t.title,
          mood: t.mood,
          description: t.description,
        })),
        moodPatterns: transactions.reduce<Record<string, number>>(
          (acc, t) => {
            acc[t.mood] = (acc[t.mood] || 0) + t.amount;
            return acc;
          },
          {}
        ),
      };

      const systemPrompt = `You are a mindful financial advisor who combines practical financial guidance with mindfulness practices. For each response:
        Acknowledge the financial concern.
        Offer relevant financial advice based on the user's financial data.

        **If the user's query expresses stress, anxiety, or overwhelm regarding their financial situation, include a brief mindfulness technique or practice that can help. Look for keywords or phrases indicating emotional distress related to their finances.**

        **If including mindfulness advice:**
            Ensure it aligns with the specific financial situation.
            Suggest breathing exercises, meditation, or mindful awareness practices that can help reduce financial stress and support better financial decision-making.

        Keep the tone compassionate and supportive.
        Format your answer properly for readability.

        User Financial Data:
        ${JSON.stringify(userData)}

        Note: All monetary values are in Philippine Peso (PHP).
      `;

      const prompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    },
    [totalBudget, remainingBudget, savings, transactions]
  );

  const generateTitle = useCallback(async (userMessage: string, aiResponse: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
    const prompt = `Summarize the following conversation into a concise title (max 5 words):\nUser: ${userMessage}\nAdvisor: ${aiResponse}`;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat";
    }
  }, []);

  const handleSend = async () => {
    if (newMessage.trim() !== "") {
      setIsLoading(true);

      const messageToSend: Omit<Message, "id" | "timestamp"> = {
        text: newMessage,
        sender: "user",
      };

      if (activeConversationId) {
        const messagesRef = collection(
          db,
          "conversations",
          activeConversationId,
          "messages"
        );
        await addDoc(messagesRef, {
          ...messageToSend,
          timestamp: serverTimestamp(),
        });

        const conversationRef = doc(db, "conversations", activeConversationId);
        await updateDoc(conversationRef, {
          lastMessage:
            newMessage.slice(0, 30) + (newMessage.length > 30 ? "..." : ""),
        });

        try {
          const aiResponse = await generateGeminiResponse(newMessage);
          const botMessage: Omit<Message, "id" | "timestamp"> = {
            text: aiResponse,
            sender: "advisor",
          };
          await addDoc(messagesRef, {
            ...botMessage,
            timestamp: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error generating AI response:", error);
          const errorMessage: Omit<Message, "id" | "timestamp"> = {
            text: "I apologize, but I'm having trouble processing your request. Please try again.",
            sender: "advisor",
          };
          await addDoc(messagesRef, {
            ...errorMessage,
            timestamp: serverTimestamp(),
          });
        } finally {
          setIsLoading(false);
          setNewMessage("");
        }
      } else {
        const conversationsRef = collection(db, "conversations");
        const newConversationRef = await addDoc(conversationsRef, {
          name: "New Chat",
          createdAt: serverTimestamp(),
        });
        setActiveConversationId(newConversationRef.id);

        const messagesRef = collection(
          db,
          "conversations",
          newConversationRef.id,
          "messages"
        );
        await addDoc(messagesRef, {
          ...messageToSend,
          timestamp: serverTimestamp(),
        });

        try {
          const aiResponse = await generateGeminiResponse(newMessage);
          const botMessage: Omit<Message, "id" | "timestamp"> = {
            text: aiResponse,
            sender: "advisor",
          };
          await addDoc(messagesRef, {
            ...botMessage,
            timestamp: serverTimestamp(),
          });

          const generatedTitleText = await generateTitle(newMessage, aiResponse);
          await setDoc(
            doc(db, "conversations", newConversationRef.id),
            {
              name: generatedTitleText,
              lastMessage: botMessage.text.slice(0, 30) + "...",
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error generating AI response:", error);
        } finally {
          setIsLoading(false);
          setNewMessage("");
        }
      }
    }
  };

  const formatAIResponse = (text: string) => {
    return text
      .split("\n")
      .map((line) => {
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        if (line.trim().startsWith("*")) {
          line = `<li>${line.substring(1).trim()}</li>`;
        } else if (/^\d+\./.test(line.trim())) {
          line = `<li>${line.substring(line.indexOf(".") + 1).trim()}</li>`;
        }

        return line;
      })
      .join("\n")
      .split("\n\n")
      .map((paragraph) => {
        if (paragraph.includes("<li>")) {
          if (/^\d+\./.test(paragraph.trim())) {
            return `<ol style="list-style-type: decimal; margin-left: 20px;">${paragraph}</ol>`;
          }
          return `<ul style="list-style-type: disc; margin-left: 20px;">${paragraph}</ul>`;
        }
        return `<p>${paragraph}</p>`;
      })
      .join("");
  };

  const handleNewChat = async () => {
    setActiveConversationId(null);
    const conversationsRef = collection(db, "conversations");
    const newConversationRef = await addDoc(conversationsRef, {
      name: "New Chat",
      createdAt: serverTimestamp(),
      lastMessage: "",
      unreadCount: 0,
    });
    setActiveConversationId(newConversationRef.id);
    setIsSidebarOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query) {
      const results = conversations.filter((conv) =>
        conv.name.toLowerCase().includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const conversationsToDisplay = searchQuery ? searchResults : conversations;

  const handleRenameClick = () => {
    if (activeConversationId) {
      const currentConversation = conversations.find(
        (conv) => conv.id === activeConversationId
      );
      if (currentConversation) {
        setIsRenaming(true);
        setRenamingText(currentConversation.name);
      }
    }
  };

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRenamingText(e.target.value);
  };

  const handleRenameSubmit = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && renamingText.trim() && activeConversationId) {
      const conversationRef = doc(db, "conversations", activeConversationId);
      await updateDoc(conversationRef, {
        name: renamingText.trim(),
      });
      setIsRenaming(false);
    }
  };

  const handleRenameBlur = async () => {
    if (isRenaming && renamingText.trim() && activeConversationId) {
      const conversationRef = doc(db, "conversations", activeConversationId);
      await updateDoc(conversationRef, {
        name: renamingText.trim(),
      });
    }
    setIsRenaming(false);
  };

  useEffect(() => {
    if (renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [isRenaming]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteDoc(doc(db, "conversations", conversationId));
        if (activeConversationId === conversationId) {
          setActiveConversationId(conversations.length > 1 ? conversations[0].id : null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    }
  };

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          lg:relative lg:translate-x-0
          w-80 bg-white dark:bg-zinc-950 border-r
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              placeholder="Search conversations"
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          {conversationsToDisplay.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-muted ${
                activeConversationId === conversation.id ? "bg-muted" : ""
              }`}
              onClick={() => {
                setActiveConversationId(conversation.id);
                setIsSidebarOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{conversation.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="bg-zinc-900 text-zinc-50 text-xs font-bold px-2 py-1 rounded-full dark:bg-zinc-50 dark:text-zinc-900">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              No conversations found.
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <Button className="w-full" onClick={handleNewChat}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            {activeConversationId && isRenaming ? (
              <Input
                ref={renameInputRef}
                value={renamingText}
                onChange={handleRenameChange}
                onKeyDown={handleRenameSubmit}
                onBlur={handleRenameBlur}
                className="text-xl font-bold focus-visible:ring-0 focus-visible:ring-transparent"
              />
            ) : (
              <h2 className="text-xl font-bold line-clamp-1">
                {conversations.find((c) => c.id === activeConversationId)?.name ||
                  "Select a conversation"}
              </h2>
            )}
          </div>
          {activeConversationId && !isRenaming && (
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRenameClick}
                className="mr-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteConversation(activeConversationId)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-4 pb-24">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback>
                    {message.sender === "user" ? "U" : "A"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg break-words ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.sender === "advisor" ? (
                    <div
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: formatAIResponse(message.text),
                      }}
                    />
                  ) : (
                    <p className="text-sm">{message.text}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
                    {message.timestamp?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-white dark:bg-zinc-950 fixed bottom-0 left-0 right-0 lg:left-80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex space-x-2 max-w-[1200px] mx-auto"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
              disabled={isLoading || !activeConversationId}
            />
            <Button type="submit" disabled={isLoading || !activeConversationId}>
              <Send className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResponsiveChatInterface;