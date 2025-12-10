"""Health check endpoint."""

from fastapi import APIRouter, HTTPException
from utils.vector_store import get_collection_info

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify service is running.

    Returns:
        Service status and component health
    """
    try:
        # Check Qdrant connection
        collection_info = get_collection_info()
        qdrant_status = {
            'status': 'healthy',
            'points_count': collection_info.points_count
        }
    except Exception as e:
        qdrant_status = {
            'status': 'unhealthy',
            'error': str(e)
        }

    return {
        'service': 'ai-textbook-backend',
        'status': 'healthy',
        'components': {
            'qdrant': qdrant_status
        }
    }
