import os

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from utils.db_connection import get_chroma_client

from utils.config import EMBEDDING_MODEL_NAME
from utils.config import COLLECTION_NAME

def setup_database(db_path="./database/chroma_db"):
    os.makedirs(db_path, exist_ok=True)
    client = get_chroma_client(db_path)
    
    try:
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={
                "hnsw:space": "cosine",
                "embedding_model": EMBEDDING_MODEL_NAME
            }
        )
        print(f"✓ Collection ready, {collection.count()} documents")
    except Exception as e:
        print(f"✗ Error creating collection: {e}")
        return False
    
    return True

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize ChromaDB for RAG system")
    parser.add_argument("--path", default="./database/chroma_db", help="Database path (default: ./database/chroma_db)")
    parser.add_argument("--reset", action="store_true", help="Reset existing database")
    
    args = parser.parse_args()
    
    if args.reset and os.path.exists(args.path):
        print(f"⚠ Resetting database at {args.path}")
        client = get_chroma_client(args.path)
        client.reset()
        print("✓ Database reset complete")
    
    setup_database(args.path)