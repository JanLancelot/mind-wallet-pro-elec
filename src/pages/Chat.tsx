import DesktopChatInterface from "@/components/desktop-chat-interface";
import Navbar from "@/components/Navbar";
import { BudgetProvider } from "@/components/BudgetContext";

function Chat() {
  return (
    <div>
      <BudgetProvider>
        <Navbar />
        <DesktopChatInterface />
      </BudgetProvider>
    </div>
  );
}

export default Chat;
