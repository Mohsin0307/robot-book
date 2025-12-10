# Quickstart Guide: AI-Native Textbook

**Phase**: 1 - Development Setup
**Date**: 2025-12-06

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git
- OpenAI API key
- Qdrant Cloud account
- Neon Postgres account

## Setup Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd my-research-paper
git checkout 001-docusaurus-docs-site
```

### 2. Frontend Setup (Docusaurus)

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### 3. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Run development server
uvicorn main:app --reload
```

### 4. Environment Variables

Create `backend/.env`:

```
OPENAI_API_KEY=sk-...
QDRANT_URL=https://...
QDRANT_API_KEY=...
NEON_DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

### 5. Database Setup

```bash
# Initialize database
python scripts/setup_db.py

# Run migrations
cd backend
alembic upgrade head
```

### 6. Embed Textbook Content

```bash
# Chunk and embed all chapters to Qdrant
python scripts/embed_textbook.py
```

## Development Workflow

1. Write chapter content in `docs/`
2. Test locally: `npm start`
3. Re-embed if content changes: `python scripts/embed_textbook.py`
4. Test backend: `uvicorn main:app --reload`
5. Build: `npm run build`

## Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest
```

## Deployment

### Frontend (GitHub Pages)

```bash
npm run build
# Push to GitHub, Actions will deploy

```

### Backend (Vercel/Railway)

Follow platform-specific deployment guides.

## Troubleshooting

- CORS errors: Check backend CORS settings
- Embedding issues: Verify Qdrant connection
- Auth issues: Check JWT secret and Neon connection

