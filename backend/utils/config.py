EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
DB_PATH = "./database/chroma_db"
DATA_PATH = "./database/context"
COLLECTION_NAME = "documents"
MANIFEST_FILE = ".ingest_manifest.json"
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".md", ".txt"}