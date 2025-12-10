"""Qdrant vector store configuration and utilities."""

import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Qdrant configuration from environment
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "textbook_embeddings"

if not QDRANT_URL or not QDRANT_API_KEY:
    raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set")

# Initialize Qdrant client
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


def init_collection():
    """
    Initialize the Qdrant collection for textbook embeddings.
    Creates collection if it doesn't exist.
    """
    collections = qdrant_client.get_collections().collections
    collection_names = [collection.name for collection in collections]

    if COLLECTION_NAME not in collection_names:
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=1536,  # OpenAI text-embedding-3-small dimension
                distance=Distance.COSINE,
            ),
        )
        print(f"Created collection: {COLLECTION_NAME}")
    else:
        print(f"Collection {COLLECTION_NAME} already exists")


def insert_embeddings(points: list[PointStruct]):
    """
    Insert embedding points into the collection.

    Args:
        points: List of PointStruct objects containing embeddings and payload
    """
    qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)


def search_similar(query_vector: list[float], limit: int = 5):
    """
    Search for similar chunks based on query vector.

    Args:
        query_vector: Query embedding vector
        limit: Number of results to return (default: 5)

    Returns:
        List of search results with score and payload
    """
    results = qdrant_client.search(
        collection_name=COLLECTION_NAME, query_vector=query_vector, limit=limit
    )
    return results


def get_collection_info():
    """Get information about the collection."""
    return qdrant_client.get_collection(collection_name=COLLECTION_NAME)
