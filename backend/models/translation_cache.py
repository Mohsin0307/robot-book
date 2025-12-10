"""TranslationCache model for storing translated content."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from utils.database import Base


class TranslationCache(Base):
    """TranslationCache model for caching translations."""

    __tablename__ = "translation_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(String(255), nullable=False)
    target_language = Column(String(10), nullable=False)
    translated_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Create unique index on chapter_id and target_language
    __table_args__ = (
        Index("idx_chapter_language", "chapter_id", "target_language", unique=True),
    )

    def __repr__(self):
        return f"<TranslationCache {self.chapter_id} - {self.target_language}>"
