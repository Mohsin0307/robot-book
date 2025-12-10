"""Chat endpoint for RAG-powered Q&A."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from services.chatbot_service import generate_answer
from models.chat_message import ChatMessage
from utils.database import get_db

router = APIRouter()


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    question: str
    user_id: Optional[str] = None
    user_context: Optional[dict] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    answer: str
    sources: list[dict]
    chunks_retrieved: int
    model_used: str
    timestamp: str


@router.post("/chat/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Answer a user question using RAG.

    Args:
        request: Chat request with question and optional user context
        db: Database session

    Returns:
        Answer with sources and metadata
    """
    if not request.question or len(request.question.strip()) == 0:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Generate answer using RAG
        result = generate_answer(request.question, request.user_context)

        # Save to database
        chat_message = ChatMessage(
            user_id=request.user_id if request.user_id else None,
            question=request.question,
            answer=result['answer'],
            chunks_retrieved=result['sources'],  # Store source metadata as JSONB
            model_used=result['model_used']
        )

        db.add(chat_message)
        db.commit()

        # Return response
        return ChatResponse(
            answer=result['answer'],
            sources=result['sources'],
            chunks_retrieved=result['chunks_retrieved'],
            model_used=result['model_used'],
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")
