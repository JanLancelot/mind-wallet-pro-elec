import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DesktopChatInterface } from "./components/desktop-chat-interface";
import Home from "./pages/Home";
import AuthPage from "./pages/Authentication";
import { AuthProvider } from "./useAuth";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />

          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<DesktopChatInterface />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
