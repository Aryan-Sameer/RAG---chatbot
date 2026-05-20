import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RAG_API = "http://localhost:8000";

const Admin = () => {
  // State for Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  // State for RAG controls
  const [setupStatus, setSetupStatus] = useState(null);   // null | 'loading' | 'success' | 'error'
  const [setupMsg, setSetupMsg] = useState('');
  const [ingestStatus, setIngestStatus] = useState(null);
  const [ingestMsg, setIngestMsg] = useState('');
  const [kbFiles, setKbFiles] = useState([]);
  const [kbFilesStatus, setKbFilesStatus] = useState('idle');
  const [kbFilesMsg, setKbFilesMsg] = useState('');

  // 1. Simple Access Check
  const handleLogin = (e) => {
    e.preventDefault();
    // In production, this should ideally be a backend check
    if (adminPassInput === "password") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect Admin Password");
    }
  };


  // RAG handlers
  const handleSetup = async () => {
    setSetupStatus('loading');
    setSetupMsg('');
    try {
      const res = await axios.post(`${RAG_API}/setup`);
      setSetupStatus('success');
      setSetupMsg(res.data.message);
    } catch (err) {
      setSetupStatus('error');
      setSetupMsg(err.response?.data?.detail || 'Setup failed');
    }
  };

  const fetchKnowledgebaseFiles = async () => {
    setKbFilesStatus('loading');
    setKbFilesMsg('');
    try {
      const res = await axios.get(`${RAG_API}/knowledgebase/files`);
      setKbFiles(Array.isArray(res.data?.files) ? res.data.files : []);
      setKbFilesStatus('success');
    } catch (err) {
      setKbFilesStatus('error');
      setKbFilesMsg(err.response?.data?.detail || 'Failed to load knowledge-base files');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchKnowledgebaseFiles();
    }
  }, [isAuthenticated]);

  const handleIngest = async (forceRebuild = false) => {
    setIngestStatus('loading');
    setIngestMsg('');
    try {
      const res = await axios.post(`${RAG_API}/ingest?force_rebuild=${forceRebuild}`);
      setIngestStatus('success');
      setIngestMsg(res.data.message || 'Ingestion completed');
      await fetchKnowledgebaseFiles();
    } catch (err) {
      setIngestStatus('error');
      setIngestMsg(err.response?.data?.detail || 'Ingestion failed');
    }
  };

  // --- VIEW 1: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <div className="p-8 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Enter Admin Password"
              className="border p-2 rounded"
              value={adminPassInput}
              onChange={e => setAdminPassInput(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded cursor-pointer">
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW 2: ADMIN TOOLS ---
  return (
    <div className='text-center m-auto p-10 w-full'>

      {/* ── RAG Knowledge Base Section ── */}
      <h3 className="text-lg font-bold mb-1">Knowledge Base</h3>
      <p className="text-sm text-gray-500 mb-6">Set up and populate the RAG vector database</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md m-auto">

        {/* Setup DB */}
        <div className="flex-1 border rounded-lg p-4 text-left">
          <p className="text-sm font-semibold mb-1">Step 1 · Setup Database</p>
          <p className="text-xs text-gray-400 mb-3">Initialize ChromaDB collection</p>
          <button
            onClick={handleSetup}
            disabled={setupStatus === 'loading'}
            className={`w-full p-2 rounded text-sm font-medium cursor-pointer transition-colors
                ${setupStatus === 'loading'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {setupStatus === 'loading' ? 'Running…' : 'Run Setup'}
          </button>
          {setupMsg && (
            <p className={`mt-2 text-xs ${setupStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {setupStatus === 'success' ? '✓ ' : '✗ '}{setupMsg}
            </p>
          )}
        </div>

        {/* Ingest */}
        <div className="flex-1 border rounded-lg p-4 text-left">
          <p className="text-sm font-semibold mb-1">Step 2 · Ingest Documents</p>
          <p className="text-xs text-gray-400 mb-3">Smart ingest skips when files are unchanged</p>
          <button
            onClick={() => handleIngest(false)}
            disabled={ingestStatus === 'loading'}
            className={`w-full p-2 rounded text-sm font-medium cursor-pointer transition-colors
                ${ingestStatus === 'loading'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {ingestStatus === 'loading' ? 'Ingesting…' : 'Run Smart Ingestion'}
          </button>
          <button
            onClick={() => handleIngest(true)}
            disabled={ingestStatus === 'loading'}
            className={`w-full p-2 rounded text-sm font-medium cursor-pointer transition-colors mt-2
                ${ingestStatus === 'loading'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Force Re-ingest (Delete & Rebuild)
          </button>
          {ingestMsg && (
            <p className={`mt-2 text-xs ${ingestStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {ingestStatus === 'success' ? '✓ ' : '✗ '}{ingestMsg}
            </p>
          )}
        </div>

      </div>

      <div className="mt-8 max-w-md m-auto border rounded-lg p-4 text-left">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Knowledge-base Files</p>
          <button
            onClick={fetchKnowledgebaseFiles}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {kbFilesStatus === 'loading' && <p className="text-xs text-gray-500">Loading files…</p>}
        {kbFilesStatus === 'error' && <p className="text-xs text-red-500">{kbFilesMsg}</p>}
        {kbFilesStatus === 'success' && kbFiles.length === 0 && (
          <p className="text-xs text-gray-500">No supported files found in knowledge base.</p>
        )}
        {kbFilesStatus === 'success' && kbFiles.length > 0 && (
          <ul className="space-y-2 max-h-56 overflow-auto">
            {kbFiles.map((file) => (
              <li key={`${file.name}-${file.modified_at}`} className="text-xs border rounded p-2 bg-gray-50">
                <p className="font-medium text-gray-700">{file.name}</p>
                <p className="text-gray-500">{(file.size_bytes / 1024).toFixed(1)} KB</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* ── End RAG Section ── */}

    </div>
  );
};

export default Admin;