import { useState, useRef, useEffect } from "react";
import AssistantMessage from "../components/AssistantMessage";
import TypingIndicator from "../components/TypingIndicator";
import "../components/assistant.css";

const API = "http://localhost:8000";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your EEE department assistant. How can i help you?",
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
      const res = await fetch(`${API}/chat`, {
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
    <section className="assistant-page w-full h-screen flex bg-stone-100">

      <main className="assistant-main flex-1 flex flex-col overflow-hidden">

        <div className="assistant-messages-area flex-1 overflow-y-auto flex flex-col">
          {messages.map((msg, i) => (
            <AssistantMessage key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="assistant-input-area border-t">
          <div className="assistant-input-wrapper flex items-end">
            <textarea
              ref={inputRef}
              className="assistant-chat-input flex-1"
              placeholder="what's your query?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="assistant-send-btn flex items-center justify-center"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <small className="text-center mb-2">
          BRO-GPT is an AI and can make mistakes. Please consult department faculty for accurate information.
        </small>
      </main>
    </section>
  );
}