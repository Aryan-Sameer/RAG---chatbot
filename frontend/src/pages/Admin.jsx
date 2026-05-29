import React from "react";
import { useAdmin } from "../lib/hooks";

const ALLOWED_EXTENSIONS = ".pdf,.docx,.xlsx,.xls,.md,.txt";

const Admin = () => {
  const {
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
  } = useAdmin();

  return (
    <div className="h-full overflow-y-auto bg-linear-to-b from-stone-100 to-stone-200">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-stone-500">
            Upload documents, initialize the vector database, and ingest content for VNRGPT.
          </p>
          {dbReady && (
            <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800">
              Database initialized
            </span>
          )}
        </header>

        {/* Upload */}
        <section className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">Upload documents</h2>
          <p className="mt-1 text-xs text-stone-500">
            Files are saved to <code className="rounded bg-stone-100 px-1">backend/database/context</code>.
            Supported: PDF, DOCX, XLSX, XLS, MD, TXT.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 transition hover:border-indigo-300 hover:bg-indigo-50/30"
          >
            <p className="text-sm text-stone-600">Drag &amp; drop files here, or</p>
            <button
              type="button"
              disabled={isActionRunning}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadStatus === "loading" ? "Uploading…" : "Choose files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS}
              className="hidden"
              onChange={onFileInputChange}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={autoIngestAfterUpload}
              onChange={(e) => setAutoIngestAfterUpload(e.target.checked)}
              className="rounded border-stone-300"
            />
            Run smart ingestion automatically after upload
          </label>

          {uploadMsg && (
            <p
              className={`mt-3 text-xs ${uploadStatus === "success" ? "text-emerald-600" : "text-red-500"}`}
            >
              {uploadStatus === "success" ? "✓ " : "✗ "}
              {uploadMsg}
            </p>
          )}
        </section>

        {/* Setup & Ingest */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Step 1
            </span>
            <h2 className="mt-1 text-sm font-semibold text-stone-800">Setup database</h2>
            <p className="mt-1 text-xs text-stone-500">Initialize the ChromaDB collection.</p>
            <button
              onClick={handleSetup}
              disabled={isActionRunning}
              className="mt-4 w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {setupStatus === "loading" ? "Running…" : "Run setup"}
            </button>
            {setupMsg && (
              <p
                className={`mt-2 text-xs ${setupStatus === "success" ? "text-emerald-600" : "text-red-500"}`}
              >
                {setupStatus === "success" ? "✓ " : "✗ "}
                {setupMsg}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Step 2
            </span>
            <h2 className="mt-1 text-sm font-semibold text-stone-800">Ingest documents</h2>
            <p className="mt-1 text-xs text-stone-500">
              Embeds files into the vector store. Skips if nothing changed.
            </p>
            <button
              onClick={() => handleIngest(false)}
              disabled={isActionRunning}
              className="mt-4 w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {ingestStatus === "loading" ? "Ingesting…" : "Smart ingest"}
            </button>
            <button
              onClick={() => handleIngest(true)}
              disabled={isActionRunning}
              className="mt-2 w-full rounded-lg border border-stone-300 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Force re-ingest
            </button>
            {ingestMsg && (
              <p
                className={`mt-2 text-xs ${ingestStatus === "success" ? "text-emerald-600" : "text-red-500"}`}
              >
                {ingestStatus === "success" ? "✓ " : "✗ "}
                {ingestMsg}
              </p>
            )}
          </section>
        </div>

        {/* File list */}
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-800">Stored files</h2>
            <button
              onClick={fetchKnowledgebaseFiles}
              disabled={kbFilesStatus === "loading"}
              className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {kbFilesStatus === "loading" && (
            <p className="mt-4 text-xs text-stone-500">Loading files…</p>
          )}
          {kbFilesStatus === "error" && (
            <p className="mt-4 text-xs text-red-500">{kbFilesMsg}</p>
          )}
          {kbFilesStatus === "success" && kbFiles.length === 0 && (
            <p className="mt-4 text-xs text-stone-500">No documents yet. Upload files above.</p>
          )}
          {kbFilesStatus === "success" && kbFiles.length > 0 && (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {kbFiles.map((file) => (
                <li
                  key={`${file.name}-${file.modified_at}`}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-medium text-stone-800">{file.name}</p>
                    <p className="text-stone-500">
                      {file.extension} · {(file.size_bytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Admin;
