"""RAG (Retrieval Augmented Generation) service for retrieving relevant chunks."""

from typing import List, Dict
from utils.vector_store import search_similar
from services.embedding_service import embed_query


def retrieve_relevant_chunks(query: str, top_k: int = 5) -> List[Dict]:
    """
    Retrieve top-k most relevant chunks for a given query.

    Args:
        query: User question
        top_k: Number of chunks to retrieve (default: 5)

    Returns:
        List of relevant chunks with metadata and scores
    """
    # Create embedding for the query
    query_embedding = embed_query(query)

    # Search for similar chunks in Qdrant
    search_results = search_similar(query_embedding, limit=top_k)

    # Extract and format results
    relevant_chunks = []
    for result in search_results:
        chunk = {
            'chapter_id': result.payload['chapter_id'],
            'chapter_title': result.payload['chapter_title'],
            'part': result.payload['part'],
            'chunk_index': result.payload['chunk_index'],
            'chunk_text': result.payload['chunk_text'],
            'relevance_score': result.score,
        }
        relevant_chunks.append(chunk)

    return relevant_chunks


def format_context_for_llm(chunks: List[Dict]) -> str:
    """
    Format retrieved chunks into context string for LLM.

    Args:
        chunks: List of relevant chunks

    Returns:
        Formatted context string
    """
    if not chunks:
        return "No relevant context found."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_part = f"""
[Source {i}: {chunk['chapter_title']} ({chunk['chapter_id']})]
{chunk['chunk_text']}
---"""
        context_parts.append(context_part)

    return "\n\n".join(context_parts)
