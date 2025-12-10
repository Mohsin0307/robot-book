# Gemini CLI Setup for Spec-Driven Development

This directory contains the configuration and scripts for using Google Gemini AI as a seamless alternative to Claude Code, with shared conversation history and state management.

## Overview

When you hit Claude's usage limits, you can seamlessly switch to Gemini CLI, which will automatically:
- Load the context from your last Claude session
- Continue from where Claude stopped
- Maintain the same Spec-Driven Development (SDD) workflow
- Share the same `history/prompts/` and `history/adr/` directories

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env and add your GOOGLE_GEMINI_API_KEY
# Get your key from: https://aistudio.google.com/app/apikey

# Initialize Gemini CLI
npm run gemini:init
```

### 2. Export Context from Claude

When you're ready to switch from Claude to Gemini:

```bash
npm run claude:export
```

This interactive script will ask you to provide:
- Brief summary of current work
- Current feature name
- Current branch
- Pending tasks
- Recent files worked on

### 3. Start Gemini Chat

```bash
npm run gemini:chat
```

Gemini will automatically:
- Load your guidelines from `.gemini/rules/guidelines.md`
- Load your project constitution from `.specify/memory/constitution.md`
- Import the context you exported from Claude
- Continue the conversation seamlessly

### 4. Switch Back to Claude (Optional)

When you want to return to Claude:

```bash
npm run gemini:import
```

This displays the current Gemini context that Claude can see and continue from.

## Directory Structure

```
.gemini/
├── README.md              # This file
├── config.json           # Gemini model configuration
├── rules/
│   └── guidelines.md     # Gemini-specific guidelines (SDD workflow)
└── state/
    ├── context.json      # Shared state for Claude ↔ Gemini handoff
    ├── todos.json        # Shared todo list
    ├── .gitignore        # Ignore runtime state files
    ├── context.template.json
    └── todos.template.json
```

## Shared Directories

These directories are shared between Claude and Gemini:

- `history/prompts/` - Prompt History Records (PHRs)
- `history/adr/` - Architecture Decision Records (ADRs)
- `specs/` - Feature specifications, plans, and tasks
- `.specify/` - SpecKit Plus templates and scripts

## Configuration

### Gemini Model Settings

Edit `.gemini/config.json` to customize:

```json
{
  "model": "gemini-2.0-flash-exp",  // or "gemini-1.5-pro"
  "temperature": 0.7,
  "topP": 0.95,
  "topK": 40,
  "maxOutputTokens": 8192
}
```

### Available Models

- **gemini-2.0-flash-exp**: Fast, efficient, good for most tasks
- **gemini-1.5-pro**: More powerful, better for complex reasoning

## Features

### 🔄 Seamless Context Switching

Gemini automatically loads:
- Conversation summary from Claude
- Current feature and branch
- Pending and completed tasks
- Recent files worked on
- Project guidelines and constitution

### 📝 Shared Prompt History Records (PHRs)

Both Claude and Gemini create PHRs in the same `history/prompts/` directory, maintaining a unified history of all work.

### 🏗️ Shared Architecture Decision Records (ADRs)

Architectural decisions are tracked in `history/adr/`, visible to both agents.

### ✅ Synchronized Todo Lists

The `.gemini/state/todos.json` file keeps track of tasks across both agents.

## Commands

### NPM Scripts

```bash
# Initialize Gemini CLI (check dependencies, API key, load context)
npm run gemini:init

# Start interactive Gemini chat session
npm run gemini:chat

# Export Claude context for Gemini to import
npm run claude:export

# Display Gemini context for Claude to see
npm run gemini:import
```

### Gemini Chat Commands

Inside the Gemini chat session:

- `exit` - Save context and exit
- `save` - Save current context without exiting
- `help` - Show available commands

## Workflow Examples

### Example 1: Switching Mid-Feature

```bash
# Working with Claude on a feature
# ... Claude hits usage limit ...

# Export context
npm run claude:export
# Provide: "Implementing user authentication, added login API"
# Feature: "user-auth"
# Pending: "Add logout endpoint, Write tests"

# Start Gemini
npm run gemini:chat
# Gemini: "I see you were working on user authentication.
#         You've completed the login API and need to add
#         the logout endpoint and write tests. Let's continue!"
```

### Example 2: Daily Handoff

```bash
# End of day with Claude
npm run claude:export

# Next morning with Gemini
npm run gemini:chat
# Gemini picks up where Claude left off

# Later, back to Claude
npm run gemini:import
# Claude sees what Gemini accomplished
```

## Best Practices

### 1. Regular Context Exports

Export context frequently when switching agents:
```bash
npm run claude:export
```

### 2. Keep Summaries Concise

When exporting context, keep summaries to 1-2 sentences focusing on:
- What was accomplished
- What's pending

### 3. Update State After Major Changes

Gemini automatically saves state, but you can manually save:
```
You: save
```

### 4. Use Descriptive Task Lists

Break work into clear, actionable tasks that either agent can understand.

### 5. Reference Files by Path

When discussing code, use full file paths so both agents can find them:
```
src/components/LoginForm.tsx
backend/api/auth.py
```

## Troubleshooting

### API Key Not Found

```bash
Error: GOOGLE_GEMINI_API_KEY not found in .env
```

**Solution**:
1. Copy `.env.example` to `.env`
2. Add your API key: `GOOGLE_GEMINI_API_KEY=your_key_here`
3. Get key from: https://aistudio.google.com/app/apikey

### Dependencies Missing

```bash
⚠️  @google/generative-ai not found
```

**Solution**: Run `npm install` or `npm run gemini:init`

### Context Not Loading

**Solution**: Make sure you've run `npm run claude:export` first

### Safety Settings Block Response

If Gemini blocks a response due to safety settings, edit `.gemini/config.json`:

```json
"safetySettings": {
  "HARM_CATEGORY_HARASSMENT": "BLOCK_MEDIUM_AND_ABOVE",
  "HARM_CATEGORY_HATE_SPEECH": "BLOCK_MEDIUM_AND_ABOVE"
}
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` to version control
- Keep your `GOOGLE_GEMINI_API_KEY` secret
- `.gemini/state/*.json` files are in `.gitignore` to prevent accidental commits
- Template files (`.template.json`) are safe to commit

## Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com/app/apikey)
- [Pricing](https://ai.google.dev/pricing)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your API key is valid
3. Ensure all dependencies are installed (`npm install`)
4. Check the console for detailed error messages

---

**Happy coding with Gemini! 🚀**
