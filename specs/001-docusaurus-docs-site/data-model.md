# Data Model: AI-Native Textbook

**Phase**: 1 - Data Model Design
**Date**: 2025-12-06

## Neon Postgres Models

### User Table

**Table**: users

- id: UUID (PRIMARY KEY)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- education_level: VARCHAR(50) CHECK IN beginner/intermediate/advanced
- goals: TEXT
- prior_knowledge: TEXT
- created_at: TIMESTAMP DEFAULT NOW()

### Session Table

**Table**: sessions

- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY)
- token_hash: VARCHAR(255) UNIQUE NOT NULL
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()

### ChatMessage Table

**Table**: chat_messages

- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY, NULLABLE)
- question: TEXT NOT NULL
- answer: TEXT NOT NULL
- chunks_retrieved: JSONB NOT NULL
- model_used: VARCHAR(50) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()

### TranslationCache Table

**Table**: translation_cache

- id: UUID (PRIMARY KEY)
- chapter_id: VARCHAR(255) NOT NULL
- target_language: VARCHAR(10) NOT NULL
- translated_content: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- UNIQUE INDEX on (chapter_id, target_language)

## Qdrant Vector Store

### Collection: textbook_embeddings

**Configuration**:
- Dimension: 1536 (OpenAI text-embedding-3-small)
- Distance: Cosine similarity
- Index: HNSW (M=16, ef_construct=100)

**Payload**:
- chapter_id: string
- chapter_title: string
- chunk_index: integer
- chunk_text: string
- part: string
- chunk_token_count: integer

## Relationships

- User (1) → (N) Session
- User (1) → (N) ChatMessage
- Chapter (1) → (N) ChapterEmbedding

## Validation Rules

- Email format validation
- Password min 8 chars
- Education level enum
- Session expires after 7 days

## Security

- Bcrypt password hashing (cost 12)
- httpOnly secure cookies
- Environment variables for API keys
