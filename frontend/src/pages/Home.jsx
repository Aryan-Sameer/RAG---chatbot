import { useChat } from "../lib/hooks";
import AssistantMessage from "../components/AssistantMessage";
import TypingIndicator from "../components/TypingIndicator";
import "../components/assistant.css";

export default function Home() {
  const {
    messages,
    input,
    setInput,
    loading,
    bottomRef,
    inputRef,
    sendMessage,
    handleKey,
  } = useChat();

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
