import argparse
import os
import time

import psutil
from sentence_transformers import CrossEncoder

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_ollama import OllamaLLM

EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def print_ram():
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    print(f"RAM usage: {mem:.1f} MB")


print("→ Loading embedding model...")
embedding_model = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_NAME,
    model_kwargs={"device": "cpu", "trust_remote_code": True},
)
print_ram()

print("→ Loading reranker model...")
reranker = CrossEncoder(
    RERANKER_MODEL_NAME,
    device="cpu",
)

PROMPT_TEMPLATE = PromptTemplate.from_template(
    """You are a helpful assistant

    Context:
    {context}

    Question: {question}
    Answer:"""
)


def call_ollama(prompt, model):
    try:
        llm = OllamaLLM(model=model, num_ctx=1024, temperature=0)
        answer = llm.invoke(prompt)
        print_ram()
        return (answer or "").strip()
    except Exception as e:
        print(f"✗ Error calling Ollama: {e}")
        return None

# ── Main query function ─────────────────────────────────────────────────────
def query_and_answer(question, db_path="./chroma_db", n_results=3, model="smollm2:360m"):

    start = time.time()

    # Generate query embedding
    print("→ Generating query embedding...")
    query_embedding = embedding_model.embed_query(question)
    print_ram()

    # Connect to ChromaDB
    print(f"→ Connecting to ChromaDB at {db_path}...")
    try:
        vectorstore = Chroma(
            collection_name="documents",
            persist_directory=db_path,
            embedding_function=embedding_model,
        )
        collection = vectorstore._collection
        print(f"✓ Connected to collection with {collection.count()} documents")
    except Exception as e:
        print("✗ Error: Collection not found. Run setup.py first.")
        return None

    # Step 1: Fetch more candidates than needed for reranking
    fetch_k = max(n_results * 3, 10)
    print(f"→ Retrieving top {fetch_k} candidate chunks for reranking...")
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=fetch_k,
        include=["documents", "metadatas", "distances"],
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
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)

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