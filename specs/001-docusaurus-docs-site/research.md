# Research Document: AI-Native Textbook

**Phase**: 0 - Research & Technology Selection
**Date**: 2025-12-06

## Purpose

Document technology decisions and best practices for building the AI-native textbook with RAG chatbot, authentication, personalization, and translation features.

## Key Technology Decisions

### 1. Docusaurus for Textbook Platform

**Decision**: Use Docusaurus 3.x as the textbook platform

**Rationale**:
- Purpose-built for documentation and educational content
- Built-in features: search, versioning, dark mode, responsive design
- MDX support allows embedding React components (chatbot, auth buttons)
- Excellent performance with static site generation
- Easy GitHub Pages deployment
- Large ecosystem and community support

**Alternatives Considered**:
- GitBook: Less customizable, limited free tier
- VuePress: Smaller ecosystem than Docusaurus
- Custom Next.js: More work, reinventing wheels
- MkDocs: Python-based, less React integration

**Best Practices**:
- Use MDX for interactive components
- Implement custom Docusaurus plugins for chatbot integration
- Use sidebars.js for structured navigation
- Leverage Docusaurus themes for consistent styling

### 2. RAG (Retrieval Augmented Generation) Architecture

**Decision**: OpenAI embeddings + Qdrant vector DB + OpenAI GPT-4 for generation

**Rationale**:
- OpenAI text-embedding-3-small: Cost-effective, high-quality embeddings
- Qdrant Cloud: Free tier sufficient, excellent performance, easy Python client
- GPT-4: Superior reasoning for educational explanations
- RAG pattern proven effective for Q&A over documents

**Alternatives Considered**:
- Pinecone: More expensive, no better for this use case
- Chroma: Local-first, harder to deploy
- Weaviate: More complex setup
- LlamaIndex: Abstraction layer adds unnecessary complexity

**Architecture**:
```
User Question → FastAPI Endpoint
              ↓
Embed Question (OpenAI) → Vector Search (Qdrant)
              ↓
Top-K Relevant Chunks → Context + Question → GPT-4
              ↓
Generated Answer with Citations → User
```

**Best Practices**:
- Chunk size: 500-1000 tokens with 100-token overlap
- Retrieve top-5 chunks for context
- Include metadata: chapter_title, chapter_path for citations
- Implement caching for common questions
- Rate limiting to manage API costs

### 3. Better-Auth for Authentication

**Decision**: Use Better-Auth library

**Rationale**:
- Modern, type-safe authentication library
- Built-in email/password authentication
- Session management with secure cookies
- Easy integration with various databases
- Good documentation and active development

**Alternatives Considered**:
- NextAuth.js: Tied to Next.js ecosystem
- Passport.js: Older,  more boilerplate
- Custom JWT: Security risks, reinventing wheels
- Auth0/Clerk: Overkill, cost concerns

**Integration**:
- Store users in Neon Postgres
- Use httpOnly cookies for session tokens
- Implement middleware for protected routes
- Store user preferences: education_level, goals, prior_knowledge

### 4. Neon Serverless Postgres

**Decision**: Use Neon for relational data storage

**Rationale**:
- Serverless: No infrastructure management
- Generous free tier (0.5 GB storage, 100 hours compute)
- PostgreSQL compatibility (use SQLAlchemy ORM)
- Auto-scaling and connection pooling
- Built-in branching for development

**Schema Design**:
```sql
users: id, email, password_hash, education_level, goals, prior_knowledge, created_at
sessions: id, user_id, token_hash, expires_at
chat_history: id, user_id, question, answer, chunks_retrieved, created_at
```

### 5. OpenAI Translation API

**Decision**: Use OpenAI GPT-4 for Urdu translation

**Rationale**:
- GPT-4 excellent at maintaining technical accuracy in translation
- Preserves Markdown formatting and code blocks
- Can handle context-aware translation
- Single API for both chatbot and translation

**Translation Prompt Template**:
```
Translate the following technical content from English to Urdu.
Maintain all Markdown formatting, preserve code blocks unchanged,
and keep technical terms accurate. Content: {chapter_content}
```

**Best Practices**:
- Cache translations to avoid re-translating
- Implement retry logic for API failures
- Show loading state during translation (can take 5-10s)
- Fallback to English if translation fails

### 6. Content Personalization Strategy

**Decision**: Dynamic content adjustment based on user background

**Implementation Approach**:
- Store user background in database (education_level: beginner/intermediate/advanced)
- Use GPT-4 to adapt chapter content in real-time for first visit
- Cache personalized versions per user + chapter
- Adjust: explanation depth, example complexity, prerequisite assumptions

**Personalization Prompt Template**:
```
Adapt this technical chapter for a {education_level} student
with background: {prior_knowledge} and goals: {goals}.
Adjust explanation depth and examples accordingly.
Chapter: {chapter_content}
```

### 7. Deployment Strategy

**Frontend (GitHub Pages)**:
- Build Docusaurus static site
- Deploy to GitHub Pages via GitHub Actions
- Custom domain optional
- CDN distribution via GitHub

**Backend (Cloud Hosting)**:
- Options: Vercel (Python support), Railway, Render, fly.io
- Environment variables for API keys
- Health check endpoint for monitoring
- CORS configuration for frontend domain

**Database & Vector Store**:
- Neon Postgres: Cloud-hosted, no deployment needed
- Qdrant Cloud: Cloud-hosted, no deployment needed

### 8. Cost Management

**Free Tiers**:
- GitHub Pages: Free for public repos
- Neon: 0.5 GB storage, 100 hours compute/month
- Qdrant Cloud: 1 GB storage, 1M vectors
- Vercel/Railway: Sufficient for MVP

**OpenAI API Costs** (Primary Expense):
- Embeddings: ~$0.013 per 1M tokens
- GPT-4: ~$30 per 1M tokens (input), ~$60 per 1M tokens (output)
- Budget: ~$50 for hackathon development and demo

**Cost Optimization**:
- Cache embeddings (run once during setup)
- Cache common chatbot responses
- Cache translations
- Implement rate limiting
- Use GPT-4-mini for non-critical tasks

## Implementation Priorities

1. **P0 (MVP)**: Docusaurus setup + chapter content
2. **P1**: RAG chatbot backend + embedding pipeline
3. **P2**: Better-Auth integration + user profiles
4. **P3**: Personalization feature
5. **P4**: Urdu translation feature
6. **P5**: Polish + demo preparation

## Risks & Mitigation

**Risk**: OpenAI API costs exceed budget
**Mitigation**: Aggressive caching, rate limiting, fallback to simpler models

**Risk**: Free tier limits exhausted
**Mitigation**: Monitor usage, implement quotas, upgrade if necessary

**Risk**: Translation quality issues
**Mitigation**: Manual review of key chapters, user feedback, iterative improvement

**Risk**: Deadline pressure (Nov 30)
**Mitigation**: Focus on MVP first, add features incrementally

## Next Steps (Phase 1)

1. Create data-model.md with database schemas
2. Create API contracts (OpenAPI spec)
3. Create quickstart.md for development setup
4. Update agent context with technology stack

