import { useState, useRef, useEffect } from "react";
import AssistantMessage from "../components/AssistantMessage";
import TypingIndicator from "../components/TypingIndicator";
import { API_BASE } from "../config";
import "../components/assistant.css";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm VNRGPT, your campus. I'll help you assist with your queries about the campus.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <section className="assistant-page h-full">
      <main className="assistant-main max-w-6xl mx-auto">
        <div className="assistant-messages-area">
          {messages.map((msg, i) => (
            <AssistantMessage key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="assistant-input-area">
          <div className="assistant-input-wrapper">
            <textarea
              ref={inputRef}
              className="assistant-chat-input"
              placeholder="Ask VNRGPT about your department resources…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="assistant-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="assistant-disclaimer">
            VNRGPT is an AI assistant and can make mistakes. Please verify important information
            with department faculty.
          </p>
        </div>
      </main>
    </section>
  );
}
