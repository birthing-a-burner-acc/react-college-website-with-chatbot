import React, { useState, useCallback } from "react";
import { DeepChat } from "deep-chat-react";
import "./FloatingChat.css";

const CHAT_STORAGE_KEY = "react-chat-history";

const clearStoredChat = () => {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.includes(CHAT_STORAGE_KEY))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
  }
};

const customMessageStyles = {
    default: {
      user: {
        bubble: {
          backgroundColor: '#ff3e17', 
          color: '#ffffff',           
        },
      },
      ai: {
        bubble: {
          backgroundColor: '#e5e5ea',
          color: '#000000',
        },
      },
    },
  };

const FloatingChat = () => {
  const [view, setView] = useState("closed");
  const [chatKey, setChatKey] = useState(0);

  const resetChat = useCallback(() => {
    clearStoredChat();        
    setChatKey((k) => k + 1); 
    setView("open");
  }, []);

  return (
    <>
      <button
        className={`floating-chat-button ${view !== "closed" ? "is-hidden" : ""}`}
        onClick={() => setView("open")}
        aria-label="Open chat assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat window is ALWAYS in the React tree and ALWAYS full-size. */}
      <div
        className={`floating-chat-window is-${view}`}
        role="dialog"
        aria-label="College assistant chat"
        aria-hidden={view === "closed"}
      >
        <div className="floating-chat-header">
          <span className="floating-chat-title">Eduford College Assistant</span>

          <div className="floating-chat-controls">
            <button
              className="floating-chat-control-btn"
              onClick={(e) => { e.stopPropagation(); resetChat(); }}
              aria-label="Reset conversation"
              title="Reset conversation"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <button
              className="floating-chat-control-btn"
              onClick={(e) => { e.stopPropagation(); setView("closed"); }}
              aria-label="Close chat"
              title="Close"
            >
             —
            </button>
          </div>
        </div>

        <div className="floating-chat-body">
          <DeepChat
            messageStyles={customMessageStyles} 
            key={chatKey}
            browserStorage={{
              key: CHAT_STORAGE_KEY,
              maxMessages: 500,
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
            connect={{ url: "http://localhost:5000/api/chat", method: "POST" }}
            introMessage={{
              text: "Hello! I'm your college assistant. Ask me about courses, admissions, or facilities.",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default FloatingChat;