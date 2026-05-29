import axios from "axios";
import { API_BASE } from "../config";

const api = axios.create({
  baseURL: API_BASE,
});

export const sendChatMessage = async (question) => {
  try {
    const res = await api.post("/chat", { question });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || "Something went wrong";
    throw new Error(detail);
  }
};

export const setupDatabase = async () => {
  const res = await api.post("/setup");
  return res.data;
};

export const fetchFiles = async () => {
  const res = await api.get("/knowledgebase/files");
  return res.data;
};

export const ingestDocuments = async (forceRebuild) => {
  const res = await api.post("/ingest", null, {
    params: { force_rebuild: forceRebuild },
  });
  return res.data;
};

export const uploadDocuments = async (formData) => {
  const res = await api.post("/knowledgebase/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
