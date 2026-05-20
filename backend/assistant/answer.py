# answer.py - Query RAG system and generate answer with Ollama LLM

import chromadb
from chromadb.config import Settings
import argparse
from sentence_transformers import SentenceTransformer, CrossEncoder
import requests
import time

import psutil
import os
import torch

def print_ram():
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    print(f"RAM usage: {mem:.1f} MB")

# ── Load models once at module level (not inside the function) ──────────────

normic_model = 'C:\\Users\\Aryan Sameer\\.cache\\huggingface\\hub\\models--nomic-ai--nomic-embed-text-v1.5\\snapshots\\e5cf08aadaa33385f5990def41f7a23405aec398'
reranker_model = 'C:\\Users\\Aryan Sameer\\.cache\\huggingface\\hub\\models--cross-encoder--ms-marco-MiniLM-L-6-v2\\snapshots\\c5ee24cb16019beea0893ab7796b1df96625c6b8'

print("→ Loading embedding model...")
embedding_model = SentenceTransformer(
    normic_model,
    trust_remote_code=True,
    device='cpu'
)
embedding_model.max_seq_length = 8192
print_ram()

print("→ Loading reranker model...")
reranker = CrossEncoder(
    reranker_model,
    device='cpu'
)

# ── Ollama HTTP call (replaces subprocess) ──────────────────────────────────
def call_ollama(prompt, model):
    try:
        torch.cuda.empty_cache
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_ctx": 1024}
            },
            timeout=60
        )
        response.raise_for_status()
        print_ram()
        return response.json()["response"].strip()
    except requests.exceptions.Timeout:
        print("✗ Timeout: LLM took too long to respond")
        return None
    except requests.exceptions.ConnectionError:
        print("✗ Error: Cannot connect to Ollama. Is it running?")
        return None
    except Exception as e:
        print(f"✗ Error calling Ollama: {e}")
        return None

# ── Main query function ─────────────────────────────────────────────────────
def query_and_answer(question, db_path="./chroma_db", n_results=3, model="smollm2:360m"):

    start = time.time()

    # Generate query embedding
    print("→ Generating query embedding...")
    query_embedding = embedding_model.encode([question], convert_to_numpy=True)[0]
    print_ram()

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
        print("✗ Error: Collection not found. Run setup.py first.")
        return None

    # Step 1: Fetch more candidates than needed for reranking
    fetch_k = max(n_results * 3, 10)
    print(f"→ Retrieving top {fetch_k} candidate chunks for reranking...")
    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=fetch_k
    )

    if not results['documents'][0]:
        print("✗ No relevant documents found")
        return None

    # Step 2: Rerank using cross-encoder
    print("→ Reranking chunks...")
    candidates = list(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    ))

    pairs = [[question, doc] for doc, _, _ in candidates]
    scores = reranker.predict(pairs)

    ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
    top_results = ranked[:n_results]

    # Step 3: Build context from reranked top results
    contexts = []
    sources = []
    for score, (doc, metadata, distance) in top_results:
        contexts.append(f"[Source] {doc}")
        sources.append({
            'source': metadata.get('source', 'Unknown'),
            'chunk': metadata.get('chunk_index', 'N/A'),
            'similarity': float(score)
        })

    context = "\n\n".join(contexts)

    # Step 4: Build simplified prompt (suitable for small models)
    prompt = f"""You are a helpful assistant

    Context:
    {context}

    Question: {question}
    Answer:"""

    print(f"→ Generating answer with {model}...")
    print("\n" + "=" * 80)
    print(f"QUESTION: {question}")
    print("=" * 80 + "\n")

    answer = call_ollama(prompt, model)

    if answer is None:
        return None

    print("ANSWER:")
    print("-" * 80)
    print(answer)
    print("\n" + "=" * 80)

    # Show sources
    print("\nSOURCES:")
    print("-" * 80)
    for i, src in enumerate(sources, 1):
        print(f"{i}. {src['source']} (chunk {src['chunk']}) - Reranker Score: {src['similarity']:.3f}")
    print("=" * 80 + "\n")

    end = time.time()
    print_ram()
    print(f"\nTime taken to generate the answer = {end - start:.2f}s")

    return answer


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Query RAG system with LLM answer generation")
    parser.add_argument("question", help="Question to ask")
    parser.add_argument("--db", default="./chroma_db", help="Database path (default: ./chroma_db)")
    parser.add_argument("--top-k", type=int, default=3, help="Number of chunks to retrieve after reranking (default: 3)")
    parser.add_argument("--model", default="smollm2:360m", help="Ollama model to use (default: smollm2:360m)")

    args = parser.parse_args()

    success = query_and_answer(
        args.question,
        args.db,
        args.top_k,
        args.model
    )

    if not success:
        exit(1)