import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, Plus, Menu, ArrowLeft } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useBudget } from "./BudgetContext";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY!);

type Message = {
  id: number;
  text: string;
  sender: "user" | "advisor";
  timestamp: Date;
};

type Conversation = {
  id: number;
  name: string;
  lastMessage: string;
  unreadCount: number;
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
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Financial Advice",
      lastMessage: "How can we help improve your financial well-being?",
      unreadCount: 0,
    },
  ]);

  const [activeConversation, setActiveConversation] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Welcome! Let's work towards achieving your financial goals.",
      sender: "advisor",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateGeminiResponse = async (userMessage: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

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
      Acknowledge the financial concern,
      Offer relevant financial advice based on the user's financial data,
      Include a brief mindfulness technique or practice that can help with the specific financial situation,
      Keep the tone compassionate and supportive,
      
      Remember to suggest breathing exercises, meditation, or mindful awareness practices that can help reduce financial stress and support better financial decision-making. Format your answer properly for readability.
      
      User Financial Data:
      ${JSON.stringify(userData)}
      
      Note: All monetary values are in Philippine Peso (PHP).
    `;

    const prompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  };

  const handleSend = async () => {
    if (newMessage.trim() !== "") {
      setIsLoading(true);
      const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);

      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === activeConversation
            ? {
                ...conv,
                lastMessage:
                  newMessage.slice(0, 30) +
                  (newMessage.length > 30 ? "..." : ""),
              }
            : conv
        )
      );

      try {
        const aiResponse = await generateGeminiResponse(newMessage);
        const botMessage: Message = {
          id: messages.length + 2,
          text: aiResponse,
          sender: "advisor",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error generating AI response:", error);
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "I apologize, but I'm having trouble processing your request. Please try again.",
          sender: "advisor",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }

      setNewMessage("");
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

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      {/* Sidebar */}
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
            <Input placeholder="Search conversations" className="pl-8" />
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
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-muted ${
                activeConversation === conversation.id ? "bg-muted" : ""
              }`}
              onClick={() => {
                setActiveConversation(conversation.id);
                setIsSidebarOpen(false);
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
        </ScrollArea>

        <div className="p-4 border-t">
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
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
            <h2 className="text-xl font-bold line-clamp-1">
              {conversations.find((c) => c.id === activeConversation)?.name}
            </h2>
          </div>
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
                    {message.timestamp.toLocaleTimeString([], {
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
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
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