import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AuthPage from "./pages/Authentication";
import { AuthProvider } from "./useAuth";
import { NotificationProvider } from "./components/NotificationContext";
import Chat from "./pages/Chat";
import Contact from "./pages/Contact";
import About from "./pages/About";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthPage />} />

            <Route path="/home" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
