import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "utils"))

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from db_connection import get_chroma_client

EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"

def setup_database(db_path="./database/chroma_db"):
    """Initialize ChromaDB with persistent storage"""

    os.makedirs(db_path, exist_ok=True)

    client = get_chroma_client(db_path)

    try:
        client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu", "trust_remote_code": True},
        )
        collection = Chroma(
            collection_name="documents",
            client=client,
            embedding_function=embeddings,
        )
        print(f"✓ Collection 'documents' ready")
        print(f"✓ Database location: {db_path}")
        print(f"✓ Current document count: {collection._collection.count()}")
        
    except Exception as e:
        print(f"✗ Error creating collection: {e}")
        return False
    
    print("\n✓ Setup complete!")
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