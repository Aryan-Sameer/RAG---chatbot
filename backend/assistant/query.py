# query.py - Query the RAG system and retrieve top results

import chromadb
from chromadb.config import Settings
import argparse
from sentence_transformers import SentenceTransformer

def query_database(question, db_path="./chroma_db", n_results=5):
    """Query ChromaDB and return top results"""
    
    # Load embedding model
    print(f"→ Loading nomic-embed-text-v1 model...")
    try:
        model = SentenceTransformer(
            'nomic-ai/nomic-embed-text-v1.5',
            trust_remote_code=True,
            device='cuda'
        )
        model.max_seq_length = 8192
        print("✓ Model loaded on CUDA")
    except Exception as e:
        print(f"⚠ CUDA not available, using CPU: {e}")
        model = SentenceTransformer(
            'nomic-ai/nomic-embed-text-v1.5',
            trust_remote_code=True
        )
    
    # Generate query embedding
    print(f"→ Generating query embedding...")
    query_embedding = model.encode([question], convert_to_numpy=True)[0]
    
    # Connect to ChromaDB
    print(f"→ Connecting to ChromaDB at {db_path}...")
    client = chromadb.PersistentClient(
        path=db_path,
        settings=Settings(anonymized_telemetry=False)
    )
    
    try:
        collection = client.get_collection(name="documents")
        print(f"✓ Connected to collection with {collection.count()} documents")
    except Exception as e:
        print(f"✗ Error: Collection not found. Run setup.py first.")
        return False
    
    # Query collection
    print(f"→ Querying for top {n_results} results...")
    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=n_results
    )
    
    # Print results
    print("\n" + "="*80)
    print(f"QUESTION: {question}")
    print("="*80 + "\n")
    
    if not results['documents'][0]:
        print("✗ No results found")
        return True
    
    for i, (doc, metadata, distance) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        print(f"RESULT #{i+1}")
        print(f"Score: {1 - distance:.4f}")  # Convert distance to similarity
        print(f"Source: {metadata.get('source', 'Unknown')}")
        print(f"Chunk: {metadata.get('chunk_index', 'N/A')}")
        print(f"-" * 80)
        print(doc)
        print("\n" + "="*80 + "\n")
    
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Query the RAG system")
    parser.add_argument("question", help="Question to ask")
    parser.add_argument("--db", default="./chroma_db", help="Database path (default: ./chroma_db)")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results to return (default: 5)")
    
    args = parser.parse_args()
    
    success = query_database(
        args.question,
        args.db,
        args.top_k
    )
    
    if not success:
        exit(1)