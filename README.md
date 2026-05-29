# VNRGPT

**VNRGPT** is a Retrieval-Augmented Generation (RAG) assistant for the EEE department. It answers student questions using department documents stored in a local vector database, powered by LangChain, ChromaDB, Hugging Face embeddings, cross-encoder reranking, and Ollama for text generation.

---

## Features

### Chat interface
- Clean, responsive chat UI for asking questions about ingested course materials.
- Streaming-style loading indicator while the model generates a response.
- Grounded answers built from retrieved document chunks (not open-ended hallucination by default).

### Advanced RAG pipeline
- **Embedding model:** `nomic-ai/nomic-embed-text-v1.5` via LangChain Hugging Face integration.
- **Vector store:** ChromaDB with persistent storage.
- **Reranking:** Cross-encoder (`ms-marco-MiniLM-L-6-v2`) re-scores retrieved chunks before prompting the LLM.
- **Generation:** Ollama local LLM (configurable model, default in API: `llama3.2:latest`).

### Knowledge base management (Admin)
- Password-protected admin panel (`/admin`, default password: `password`).
- **Upload documents** — drag-and-drop or file picker; files are saved to `backend/database/context`.
- **Setup database** — initializes the ChromaDB collection.
- **Smart ingest** — embeds and indexes documents; skips re-ingestion when files are unchanged (manifest-based).
- **Force re-ingest** — deletes and rebuilds the vector collection.
- Optional **auto-ingest after upload** for a one-step upload → index workflow.
- Live list of stored knowledge-base files with size and type.

### Supported document formats
| Format | Extension |
|--------|-----------|
| PDF    | `.pdf`    |
| Word   | `.docx`   |
| Excel  | `.xlsx`, `.xls` |
| Markdown | `.md`   |
| Plain text | `.txt` |

---

## Architecture

```
┌─────────────┐     REST API      ┌──────────────────────────────────────┐
│  React UI   │ ◄──────────────►  │  FastAPI (backend/main.py)           │
│  VNRGPT     │                   │  • /chat  • /setup  • /ingest        │
└─────────────┘                   │  • /knowledgebase/upload|files       │
                                  └──────────────┬───────────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
             ChromaDB vectors            HuggingFace embed              Ollama LLM
             (database/chroma_db)        + reranker                     (localhost:11434)
                    ▲
                    │
             database/context/  ← uploaded & ingested documents
```

---

## Prerequisites

- **Python 3.12+**
- **Node.js 18+** (for the frontend)
- **Ollama** installed and running locally  
  Pull a model, for example:
  ```bash
  ollama pull llama3.2:latest
  ```

---

## Installation

### 1. Clone and create a virtual environment

```bash
cd "Advanced RAG"
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

> First run will download embedding and reranker models from Hugging Face (may take several minutes).

### 2. Frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the application

### Start the API server

From the project root (with venv active):

```bash
cd backend
fastapi dev main.py
```

API base URL: **http://localhost:8000**  
Health check: **GET /health**

### Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## Typical workflow

1. Open **Admin** (`/admin`) and sign in.
2. **Upload** PDFs, DOCX, or other supported files.
3. Run **Setup** (first time only) to initialize ChromaDB.
4. Run **Smart ingest** (or enable auto-ingest after upload).
5. Go to **Chat** (`/`) and ask questions about your materials.

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Service health check |
| `POST` | `/setup` | Initialize ChromaDB collection |
| `POST` | `/ingest?force_rebuild=false` | Ingest files from `database/context` |
| `GET`  | `/knowledgebase/files` | List files in the data folder |
| `POST` | `/knowledgebase/upload` | Upload one or more files (`multipart/form-data`, field: `files`) |
| `POST` | `/chat` | Ask a question (`{ "question": "...", "model": "...", "top_k": 3 }`) |

---

## Project structure

```
Advanced RAG/
├── backend/
│   ├── main.py                 # FastAPI app & routes
│   ├── controllers/
│   │   ├── setup.py            # ChromaDB initialization
│   │   ├── ingest.py           # Upload save, chunking, embedding, indexing
│   │   ├── answer.py           # Retrieve, rerank, generate with Ollama
│   │   └── query.py            # CLI query utility
│   └── database/
│       ├── context/            # Knowledge-base documents (upload target)
│       └── chroma_db/          # Persistent vector store
├── frontend/
│   └── src/
│       ├── pages/Home.jsx      # Chat UI
│       ├── pages/Admin.jsx     # Admin & ingestion UI
│       └── components/         # Navbar, layout, chat components
├── requirements.txt
└── README.md
```

---

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| API URL | `frontend/src/config.js` | `http://localhost:8000` |
| Data folder | `backend/main.py` → `DATA_PATH` | `./database/context` |
| Vector DB | `backend/main.py` → `DB_PATH` | `./database/chroma_db` |
| Ollama model | `POST /chat` body `model` | `llama3.2:latest` |
| Chunks retrieved | `POST /chat` body `top_k` | `3` |

---

## Troubleshooting

| Issue | Suggestion |
|-------|------------|
| `ImportError` for LangChain packages | Recreate venv and `pip install -r requirements.txt` (pinned versions). |
| Chat returns 500 | Ensure Ollama is running and the model is pulled. Run setup + ingest first. |
| Empty answers | Confirm files exist in `backend/database/context` and ingestion completed successfully. |
| CORS errors | Frontend must run on `localhost:5173` or `3000` (configured in `main.py`). |
| Slow first query | Embedding/reranker models load at startup in `answer.py`; subsequent queries are faster. |

---

## Security note

The admin panel uses a simple client-side password for demonstration. **Do not deploy to production** without proper authentication, HTTPS, and environment-based secrets.

---

## License

Academic / departmental use. Extend and adapt as needed for VNR Vignana Jyothi Institute of Engineering and Technology EEE department workflows.
