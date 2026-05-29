import { useState, useRef, useEffect } from "react";
import {
  sendChatMessage,
  setupDatabase,
  fetchFiles,
  ingestDocuments,
  uploadDocuments,
} from "./api";

// Chat functions
export function useChat() {
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
      const data = await sendChatMessage(question);
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

  return {
    messages,
    input,
    setInput,
    loading,
    bottomRef,
    inputRef,
    sendMessage,
    handleKey,
  };
}

// Admin functions
export function useAdmin() {
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupMsg, setSetupMsg] = useState("");
  const [ingestStatus, setIngestStatus] = useState(null);
  const [ingestMsg, setIngestMsg] = useState("");
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  const [kbFiles, setKbFiles] = useState([]);
  const [kbFilesStatus, setKbFilesStatus] = useState("idle");
  const [kbFilesMsg, setKbFilesMsg] = useState("");

  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [autoIngestAfterUpload, setAutoIngestAfterUpload] = useState(true);
  const fileInputRef = useRef(null);

  const runSetup = async ({ silent = false } = {}) => {
    if (!silent) {
      setSetupStatus("loading");
      setSetupMsg("");
    }
    try {
      const data = await setupDatabase();
      if (!silent) {
        setSetupStatus("success");
        setSetupMsg(data.message);
      }
      setDbReady(true);
      return true;
    } catch (err) {
      if (!silent) {
        setSetupStatus("error");
        setSetupMsg(err.response?.data?.detail || "Setup failed");
      }
      setDbReady(false);
      return false;
    }
  };

  const handleSetup = async () => {
    if (isActionRunning) return;
    setIsActionRunning(true);
    try {
      await runSetup();
    } finally {
      setIsActionRunning(false);
    }
  };

  const fetchKnowledgebaseFiles = async () => {
    setKbFilesStatus("loading");
    setKbFilesMsg("");
    try {
      const data = await fetchFiles();
      setKbFiles(Array.isArray(data?.files) ? data.files : []);
      setKbFilesStatus("success");
    } catch (err) {
      setKbFilesStatus("error");
      setKbFilesMsg(err.response?.data?.detail || "Failed to load knowledge-base files");
    }
  };

  useEffect(() => {
    fetchKnowledgebaseFiles();
  }, []);

  const handleIngest = async (forceRebuild = false, { bypassLock = false } = {}) => {
    if (!bypassLock && isActionRunning) return;
    const manageLock = !bypassLock;
    if (manageLock) setIsActionRunning(true);
    setIngestStatus("loading");
    setIngestMsg("");

    try {
      const setupOk = dbReady ? true : await runSetup({ silent: true });
      if (!setupOk) {
        setIngestStatus("error");
        setIngestMsg("Database setup failed. Run Step 1 first, then try again.");
        return;
      }

      const data = await ingestDocuments(forceRebuild);

      setIngestStatus("success");
      setDbReady(true);
      const detail = data.reingested
        ? data.message
        : data.message || "No changes detected — ingestion skipped.";
      setIngestMsg(detail);
      await fetchKnowledgebaseFiles();
    } catch (err) {
      setIngestStatus("error");
      setIngestMsg(err.response?.data?.detail || "Ingestion failed");
    } finally {
      if (manageLock) setIsActionRunning(false);
    }
  };

  const handleUpload = async (fileList) => {
    if (!fileList?.length || isActionRunning) return;

    setIsActionRunning(true);
    setUploadStatus("loading");
    setUploadMsg("");

    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append("files", file));

    try {
      const data = await uploadDocuments(formData);

      const savedCount = data.saved?.length ?? 0;
      const errorNote =
        data.errors?.length > 0 ? ` (${data.errors.length} skipped)` : "";
      setUploadStatus("success");
      setUploadMsg(`${data.message || "Upload complete."}${errorNote}`);
      await fetchKnowledgebaseFiles();

      if (autoIngestAfterUpload && savedCount > 0) {
        await handleIngest(false, { bypassLock: true });
      }
    } catch (err) {
      setUploadStatus("error");
      setUploadMsg(err.response?.data?.detail || "Upload failed");
    } finally {
      setIsActionRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileInputChange = (e) => {
    if (e.target.files?.length) handleUpload(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
  };

  return {
    setupStatus,
    setupMsg,
    ingestStatus,
    ingestMsg,
    isActionRunning,
    dbReady,
    kbFiles,
    kbFilesStatus,
    kbFilesMsg,
    uploadStatus,
    uploadMsg,
    autoIngestAfterUpload,
    setAutoIngestAfterUpload,
    fileInputRef,
    handleSetup,
    handleIngest,
    fetchKnowledgebaseFiles,
    onFileInputChange,
    onDrop,
  };
}
