# Implementation Plan: AI-Native Textbook - Physical AI & Humanoid Robotics

**Branch**: `001-docusaurus-docs-site` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)

## Summary

Build a complete AI-native textbook for Physical AI & Humanoid Robotics covering 5 major parts. Includes Docusaurus site, RAG chatbot (OpenAI + FastAPI + Qdrant + Neon), Better-Auth authentication, personalization, and Urdu translation. Hackathon project deadline: Nov 30, 2025.

## Technical Context

**Language/Version**: TypeScript/JavaScript (Node.js 18+), Python 3.11+
**Primary Dependencies**: Docusaurus 3.x, FastAPI, OpenAI SDK, Qdrant Client, Better-Auth, Neon Postgres
**Storage**: Neon Serverless Postgres, Qdrant Cloud, Static Markdown
**Testing**: pytest, Jest, React Testing Library
**Target Platform**: GitHub Pages (frontend), Cloud hosting (backend)
**Project Type**: Web application
**Performance Goals**: Page load <3s, Chatbot <5s, Translation <10s
**Constraints**: GitHub Pages static hosting, Free tiers, Deadline Nov 30, 2025
**Scale/Scope**: 5 parts, 20-25 chapters, 500-1000 pages

## Constitution Check

✅ PASSED - All principles followed with appropriate adaptations for educational web application.

## Project Structure

### Documentation

specs/001-docusaurus-docs-site/
├── plan.md
├── research.md (Phase 0)
├── data-model.md (Phase 1)
├── quickstart.md (Phase 1)
├── contracts/ (Phase 1)
└── tasks.md (Phase 2 - /sp.tasks)

### Source Code

docs/ - Textbook chapters (5 parts, ~24 chapters)
src/ - Docusaurus components (ChatbotWidget, AuthButtons, TranslationButton)
backend/ - FastAPI (models, services, API routes)
scripts/ - Setup and deployment scripts

**Structure Decision**: Web application with Docusaurus frontend (GitHub Pages) and FastAPI backend (separate cloud hosting).

## Complexity Tracking

No violations. All complexity required by hackathon specifications.
