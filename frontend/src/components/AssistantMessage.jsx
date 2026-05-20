export default function AssistantMessage({ msg }) {
  return (
    <div className={`assistant-message ${msg.role}`}>
      <div className="assistant-msg-avatar">{msg.role === "assistant" ? "A" : "U"}</div>
      <div className={`assistant-msg-bubble ${msg.isError ? "error" : ""}`}>{msg.text}</div>
    </div>
  );
}
