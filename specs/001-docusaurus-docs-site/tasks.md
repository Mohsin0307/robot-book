# Tasks: AI-Native Textbook - Physical AI & Humanoid Robotics

**Input**: Design documents from `/specs/001-docusaurus-docs-site/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi-backend.yaml

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted per guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: Root directory (Docusaurus)
- **Backend**: `backend/` directory (FastAPI)
- **Scripts**: `scripts/` directory
- **Docs**: `docs/` directory (textbook chapters)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Docusaurus 3.x project with TypeScript support in root directory
- [X] T002 [P] Create backend directory structure: backend/models/, backend/services/, backend/routes/, backend/utils/
- [X] T003 [P] Initialize FastAPI Python project in backend/ with requirements.txt
- [X] T004 [P] Create scripts directory for utility scripts
- [X] T005 [P] Setup .gitignore for Node.js (node_modules/, .env, dist/, build/) and Python (__pycache__/, *.pyc, venv/, .env)
- [X] T006 [P] Setup .dockerignore for containerization
- [X] T007 [P] Create environment variable templates: .env.example (root), backend/.env.example
- [X] T008 Configure package.json with Docusaurus dependencies and scripts
- [X] T009 Install backend dependencies: fastapi, uvicorn, sqlalchemy, psycopg2-binary, better-auth-python, openai, qdrant-client, python-jose, bcrypt, pydantic
- [X] T010 [P] Configure ESLint and Prettier for frontend code quality
- [X] T011 [P] Configure Ruff for backend Python linting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Setup Neon Postgres connection configuration in backend/utils/database.py
- [X] T013 Create database migration system using Alembic in backend/migrations/
- [X] T014 Create database schema migrations for users table in backend/migrations/versions/
- [X] T015 [P] Create database schema migrations for sessions table in backend/migrations/versions/
- [X] T016 [P] Create database schema migrations for chat_messages table in backend/migrations/versions/
- [X] T017 [P] Create database schema migrations for translation_cache table in backend/migrations/versions/
- [X] T018 Setup Qdrant Cloud connection configuration in backend/utils/vector_store.py
- [X] T019 Create Qdrant collection "textbook_embeddings" with proper schema in backend/utils/vector_store.py
- [X] T020 [P] Setup Better-Auth configuration in backend/auth/config.py
- [X] T021 [P] Implement authentication middleware in backend/middleware/auth.py
- [X] T022 [P] Setup OpenAI API client wrapper in backend/utils/openai_client.py
- [X] T023 [P] Configure CORS middleware for FastAPI in backend/main.py
- [X] T024 [P] Setup centralized error handling in backend/middleware/error_handler.py
- [X] T025 [P] Setup logging configuration in backend/utils/logger.py
- [X] T026 Create FastAPI main application entry point in backend/main.py
- [X] T027 Configure Docusaurus config file (docusaurus.config.js) with site metadata, theme, and plugins
- [X] T028 Setup Docusaurus custom theme directory: src/theme/
- [X] T029 Create global CSS for Docusaurus in src/css/custom.css

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse Complete Textbook Content (Priority: P1) 🎯 MVP

**Goal**: Students can browse through all 5 parts of the Physical AI & Humanoid Robotics curriculum with well-structured chapters, clear navigation, and properly rendered content.

**Independent Test**: Navigate through the Docusaurus site and verify all chapters render correctly with proper formatting, code examples, images, and sidebar navigation works smoothly.

### Implementation for User Story 1

- [X] T030 [P] [US1] Create textbook structure: docs/ with 5 main part directories
- [X] T031 [P] [US1] Write Part 1 chapters in docs/part1/ (Foundations of Physical AI - 4-5 chapters with markdown)
- [X] T032 [P] [US1] Write Part 2 chapters in docs/part2/ (Robotics Fundamentals - 4-5 chapters with markdown)
- [X] T033 [P] [US1] Write Part 3 chapters in docs/part3/ (Humanoid Robotics - 4-5 chapters with markdown)
- [X] T034 [P] [US1] Write Part 4 chapters in docs/part4/ (AI for Robotics - 4-5 chapters with markdown)
- [X] T035 [P] [US1] Write Part 5 chapters in docs/part5/ (Practical Projects - 4-5 chapters with markdown)
- [X] T036 [US1] Configure sidebar navigation in sidebars.js mapping all 5 parts and chapters
- [X] T037 [P] [US1] Add code syntax highlighting configuration for Python, C++, ROS in docusaurus.config.js
- [X] T038 [P] [US1] Add math formula support using remark-math and rehype-katex plugins
- [X] T039 [P] [US1] Create custom MDX components for callouts/admonitions in src/components/
- [X] T040 [P] [US1] Add images and diagrams to static/img/ directory
- [X] T041 [US1] Test local development server (npm start) and verify all chapters render correctly
- [X] T042 [US1] Build production bundle (npm run build) and verify build succeeds

**Checkpoint**: At this point, User Story 1 should be fully functional - complete textbook browsable with proper formatting

---

## Phase 4: User Story 2 - Ask AI Chatbot Questions (Priority: P2)

**Goal**: Students can ask the embedded RAG chatbot questions about textbook content and receive accurate answers with chapter citations.

**Independent Test**: Open the chatbot widget on any chapter page, ask questions about textbook content, and verify relevant answers with proper citations to chapters.

### Implementation for User Story 2

- [X] T043 [P] [US2] Create User SQLAlchemy model in backend/models/user.py
- [X] T044 [P] [US2] Create Session SQLAlchemy model in backend/models/session.py
- [X] T045 [P] [US2] Create ChatMessage SQLAlchemy model in backend/models/chat_message.py
- [X] T046 [US2] Implement chunking script in scripts/chunk_textbook.py (chunk size: 500-1000 tokens, 100-token overlap)
- [X] T047 [US2] Implement embedding script in scripts/embed_textbook.py using OpenAI text-embedding-3-small
- [X] T048 [US2] Create embedding service in backend/services/embedding_service.py for query embeddings
- [X] T049 [US2] Implement RAG retrieval service in backend/services/rag_service.py (top-5 chunk retrieval from Qdrant)
- [X] T050 [US2] Implement chatbot service in backend/services/chatbot_service.py using OpenAI GPT-4 with retrieved context
- [X] T051 [US2] Create /health endpoint in backend/routes/health.py
- [X] T052 [US2] Create POST /chat/ask endpoint in backend/routes/chat.py
- [ ] T053 [P] [US2] Create ChatbotWidget React component in src/components/ChatbotWidget/index.tsx
- [ ] T054 [P] [US2] Add ChatbotWidget styling in src/components/ChatbotWidget/styles.module.css
- [ ] T055 [US2] Integrate ChatbotWidget into Docusaurus theme by swizzling Root component
- [ ] T056 [US2] Add chatbot icon floating button with click-to-open behavior
- [ ] T057 [US2] Implement API client for /chat/ask in src/utils/apiClient.ts
- [ ] T058 [US2] Add loading states and error handling to ChatbotWidget
- [ ] T059 [US2] Run embedding script to populate Qdrant with all chapter content
- [ ] T060 [US2] Test chatbot by asking sample questions and verifying answers with citations

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - textbook browsable + AI chatbot functional

---

## Phase 5: User Story 3 - User Authentication & Background Collection (Priority: P2)

**Goal**: Users can sign up with Better-Auth, answer background questions (education level, goals, prior knowledge), and have their preferences stored for personalization.

**Independent Test**: Test complete signup flow, login/logout, and verify user data is correctly stored in Neon Postgres database.

### Implementation for User Story 3

- [ ] T061 [US3] Implement password hashing utility using bcrypt in backend/utils/password.py
- [ ] T062 [US3] Implement JWT token generation and validation in backend/utils/jwt.py
- [ ] T063 [US3] Create user service in backend/services/user_service.py (create, authenticate, get user)
- [ ] T064 [US3] Create session service in backend/services/session_service.py (create, validate, delete session)
- [ ] T065 [US3] Create POST /auth/signup endpoint in backend/routes/auth.py
- [ ] T066 [P] [US3] Create POST /auth/login endpoint in backend/routes/auth.py
- [ ] T067 [P] [US3] Create POST /auth/logout endpoint in backend/routes/auth.py
- [ ] T068 [P] [US3] Create GET /auth/me endpoint to retrieve current user in backend/routes/auth.py
- [ ] T069 [P] [US3] Create SignupModal React component in src/components/Auth/SignupModal.tsx
- [ ] T070 [P] [US3] Create LoginModal React component in src/components/Auth/LoginModal.tsx
- [ ] T071 [P] [US3] Create OnboardingForm React component for background questions in src/components/Auth/OnboardingForm.tsx
- [ ] T072 [P] [US3] Create AuthButtons component (Sign Up / Login / Logout) in src/components/Auth/AuthButtons.tsx
- [ ] T073 [US3] Create authentication context/provider in src/contexts/AuthContext.tsx for global auth state
- [ ] T074 [US3] Implement cookie-based session management in frontend
- [ ] T075 [US3] Integrate AuthButtons into Docusaurus navbar via docusaurus.config.js customization
- [ ] T076 [US3] Add form validation for email format and password strength (min 8 chars)
- [ ] T077 [US3] Add error handling for duplicate email registration
- [ ] T078 [US3] Test complete authentication flow: signup → onboarding → login → logout

**Checkpoint**: All authentication features working - users can register, login, and their data persists

---

## Phase 6: User Story 4 - Personalized Chapter Content (Priority: P3)

**Goal**: Logged-in users see chapter content personalized to their background and learning goals with adjusted examples and explanations.

**Independent Test**: Compare content shown to users with different backgrounds (beginner vs advanced) on the same chapter.

### Implementation for User Story 4

- [ ] T079 [US4] Create personalization service in backend/services/personalization_service.py using GPT-4
- [ ] T080 [US4] Implement prompt template for content adaptation in backend/services/personalization_service.py
- [ ] T081 [US4] Create caching layer for personalized content in backend/utils/cache.py (user_id + chapter_id → content)
- [ ] T082 [US4] Create POST /personalize endpoint in backend/routes/personalize.py
- [ ] T083 [US4] Add user education level and goals to personalization request
- [ ] T084 [P] [US4] Create PersonalizedContent React component in src/components/PersonalizedContent/index.tsx
- [ ] T085 [US4] Integrate PersonalizedContent into MDX pages for logged-in users
- [ ] T086 [US4] Add loading state while personalization is processing
- [ ] T087 [US4] Fallback to original content if personalization fails
- [ ] T088 [US4] Test with beginner user profile and verify simplified content
- [ ] T089 [US4] Test with advanced user profile and verify technical depth increases

**Checkpoint**: Personalization working - content adapts based on user background

---

## Phase 7: User Story 5 - Translate Chapters to Urdu (Priority: P3)

**Goal**: Logged-in users can click a "Translate to Urdu" button on any chapter page to see content translated into Urdu in real-time with proper RTL formatting.

**Independent Test**: Click translation button on a chapter and verify Urdu content displays correctly with RTL formatting, and toggle back to English works.

### Implementation for User Story 5

- [ ] T090 [US5] Create TranslationCache SQLAlchemy model in backend/models/translation_cache.py
- [ ] T091 [US5] Create translation service in backend/services/translation_service.py using OpenAI GPT-4
- [ ] T092 [US5] Implement translation prompt template preserving Markdown and code blocks in backend/services/translation_service.py
- [ ] T093 [US5] Add cache lookup and storage in translation service
- [ ] T094 [US5] Create POST /translate endpoint in backend/routes/translate.py
- [ ] T095 [P] [US5] Create TranslationButton React component in src/components/TranslationButton/index.tsx
- [ ] T096 [P] [US5] Add RTL CSS styling for Urdu content in src/components/TranslationButton/urdu-styles.css
- [ ] T097 [US5] Integrate TranslationButton into chapter pages for logged-in users
- [ ] T098 [US5] Implement translation state management (English ↔ Urdu toggle)
- [ ] T099 [US5] Persist translation preference in session storage
- [ ] T100 [US5] Add loading indicator during translation (5-10 seconds)
- [ ] T101 [US5] Add retry logic for translation API failures
- [ ] T102 [US5] Test translation on a sample chapter and verify Urdu rendering
- [ ] T103 [US5] Test toggle between English and Urdu views
- [ ] T104 [US5] Verify translation preference persists across page navigation

**Checkpoint**: All user stories complete - full feature set operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deployment preparation

- [ ] T105 [P] Create deployment script for GitHub Pages in scripts/deploy-frontend.sh
- [ ] T106 [P] Create GitHub Actions workflow for automated frontend deployment in .github/workflows/deploy.yml
- [ ] T107 [P] Document backend deployment process in docs/deployment/backend.md
- [ ] T108 [P] Create database setup script in scripts/setup_db.py
- [ ] T109 [P] Create comprehensive README.md with setup instructions
- [ ] T110 [P] Add rate limiting middleware to backend API endpoints in backend/middleware/rate_limiter.py
- [ ] T111 [P] Implement request logging for all API endpoints
- [ ] T112 [P] Add API key validation and environment variable checks at startup
- [ ] T113 [P] Optimize bundle size by analyzing and removing unused dependencies
- [ ] T114 [P] Add SEO meta tags to Docusaurus config for better discoverability
- [ ] T115 [P] Create 404 error page in src/pages/404.tsx
- [ ] T116 [P] Add monitoring/health check dashboard for backend services
- [ ] T117 Code cleanup: Remove console.logs, add proper error messages
- [ ] T118 Security audit: Verify all API keys are in environment variables, check CORS config
- [ ] T119 Performance optimization: Check page load times (<3s), chatbot response (<5s), translation (<10s)
- [ ] T120 Run quickstart.md validation: Follow all setup steps and verify they work
- [ ] T121 Create demo video script highlighting all 5 user stories
- [ ] T122 Record 60-second demo video for hackathon submission

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - MVP target
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Can proceed in parallel with US1 if staffed
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can proceed in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on User Story 3 (requires authentication)
- **User Story 5 (Phase 7)**: Depends on User Story 3 (requires authentication)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP TARGET**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but integrates into the same site
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but required for US4 and US5
- **User Story 4 (P3)**: REQUIRES User Story 3 completion (needs authentication + user profiles)
- **User Story 5 (P3)**: REQUIRES User Story 3 completion (needs authentication)

### Within Each User Story

- Models before services
- Services before API endpoints
- Backend endpoints before frontend components
- Components before integration into main app
- Core implementation before polish

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T003, T004, T006, T007, T010, T011 can run in parallel

**Phase 2 (Foundational)**: Tasks T015-T017, T020-T025, T028-T029 can run in parallel after database setup completes

**Phase 3 (US1)**: Tasks T030-T035 (writing chapters), T037-T040 can run in parallel

**Phase 4 (US2)**: Tasks T043-T045, T053-T054 can run in parallel

**Phase 5 (US3)**: Tasks T066-T072 can run in parallel after T065 completes

**Phase 6 (US4)**: Task T084 can be done in parallel with T086-T087

**Phase 7 (US5)**: Tasks T095-T096 can run in parallel

**Phase 8 (Polish)**: Tasks T105-T116 can run in parallel

**Cross-Story Parallelism**: After Foundational phase, US1, US2, and US3 can all be worked on in parallel by different team members

---

## Parallel Example: User Story 2 (RAG Chatbot)

```bash
# Launch all models together:
Task: "Create User SQLAlchemy model in backend/models/user.py"
Task: "Create Session SQLAlchemy model in backend/models/session.py"
Task: "Create ChatMessage SQLAlchemy model in backend/models/chat_message.py"

# After backend endpoint is ready, launch frontend components:
Task: "Create ChatbotWidget React component in src/components/ChatbotWidget/index.tsx"
Task: "Add ChatbotWidget styling in src/components/ChatbotWidget/styles.module.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~2-3 hours)
2. Complete Phase 2: Foundational (~4-5 hours) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (~10-15 hours) - Write all textbook chapters
4. **STOP and VALIDATE**: Browse complete site, verify formatting
5. Deploy to GitHub Pages for initial review

**MVP Deliverable**: Fully browsable textbook with 5 parts and ~24 chapters

### Incremental Delivery

1. **Sprint 1**: Setup + Foundational + US1 → Deploy textbook site
2. **Sprint 2**: Add US2 (RAG Chatbot) → Test independently → Deploy
3. **Sprint 3**: Add US3 (Authentication) → Test independently → Deploy
4. **Sprint 4**: Add US4 (Personalization) → Test independently → Deploy
5. **Sprint 5**: Add US5 (Translation) → Test independently → Deploy
6. **Sprint 6**: Polish + Demo video → Final submission

Each sprint adds value without breaking previous features.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Phases 1-2)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Content writing)
   - **Developer B**: User Story 2 (RAG chatbot)
   - **Developer C**: User Story 3 (Authentication)
3. After US3 completes:
   - **Developer D**: User Story 4 (Personalization)
   - **Developer E**: User Story 5 (Translation)
4. **All team**: Phase 8 (Polish + Deployment)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently before proceeding
- **Content Volume**: Part 1-5 chapters represent significant work (~500-1000 pages total) - allocate sufficient time
- **API Costs**: Monitor OpenAI API usage carefully (embeddings, chatbot, translation, personalization)
- **Free Tier Limits**: Stay within Neon (0.5GB), Qdrant (1GB), and cloud hosting limits
- **Hackathon Deadline**: November 30, 2025 - prioritize MVP (US1) first, then add features incrementally
- **Demo Video**: Keep under 60 seconds, highlight all working features clearly

---

## Success Metrics

After completing all phases, verify:

- ✅ All 5 parts with ~24 chapters deployed and navigable
- ✅ RAG chatbot answers questions with 90%+ accuracy and proper citations
- ✅ Authentication flow works without errors (signup, login, logout)
- ✅ Personalization shows measurably different content for beginner vs advanced users
- ✅ Urdu translation completes in <10 seconds with proper RTL formatting
- ✅ Site loads in <3 seconds on GitHub Pages
- ✅ Chatbot responds in <5 seconds for typical questions
- ✅ All code formatted and linted (ESLint, Prettier, Ruff)
- ✅ Demo video showcases all features in 60 seconds
- ✅ Project uses Spec-Kit Plus for planning (this document proves it!)
