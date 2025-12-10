# my-research-paper Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-06

## Active Technologies

- TypeScript/JavaScript (Node.js 18+), Python 3.11+ + Docusaurus 3.x, FastAPI, OpenAI SDK, Qdrant Client, Better-Auth, Neon Postgres (001-docusaurus-docs-site)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

TypeScript/JavaScript (Node.js 18+), Python 3.11+: Follow standard conventions

## AI Agent Handoff (Claude ↔ Gemini)

This project supports seamless switching between Claude Code and Gemini CLI:

- **Shared State**: `.gemini/state/context.json` maintains conversation continuity
- **Shared History**: Both agents use `history/prompts/` for PHRs and `history/adr/` for ADRs
- **Quick Switch**: `npm run claude:export` → `npm run gemini:chat`

See `.gemini/README.md` for full setup instructions.

## Recent Changes

- 001-docusaurus-docs-site: Added TypeScript/JavaScript (Node.js 18+), Python 3.11+ + Docusaurus 3.x, FastAPI, OpenAI SDK, Qdrant Client, Better-Auth, Neon Postgres

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
