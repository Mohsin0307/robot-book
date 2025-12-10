"""ChatMessage model for storing chatbot conversations."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from utils.database import Base


class ChatMessage(Base):
    """ChatMessage model for storing chat history."""

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    chunks_retrieved = Column(JSONB, nullable=False)
    model_used = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to User (nullable for anonymous users)
    user = relationship("User", backref="chat_messages")

    def __repr__(self):
        return f"<ChatMessage {self.id}>"
