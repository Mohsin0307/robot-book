"""Embedding service for creating query embeddings."""

from utils.openai_client import create_embedding


def embed_query(query: str) -> list[float]:
    """
    Create embedding for a user query.

    Args:
        query: User question text

    Returns:
        Embedding vector as list of floats
    """
    return create_embedding(query)
