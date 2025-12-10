#!/usr/bin/env node

/**
 * Gemini CLI Chat Interface
 * Interactive chat with Gemini that maintains continuity with Claude
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

class GeminiChatSession {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    this.configPath = path.join(process.cwd(), '.gemini', 'config.json');
    this.contextPath = path.join(process.cwd(), '.gemini', 'state', 'context.json');
    this.guidelinesPath = path.join(process.cwd(), '.gemini', 'rules', 'guidelines.md');
    this.constitutionPath = path.join(process.cwd(), '.specify', 'memory', 'constitution.md');

    this.config = this.loadConfig();
    this.context = this.loadContext();
    this.guidelines = this.loadGuidelines();
    this.constitution = this.loadConstitution();

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
        maxOutputTokens: this.config.maxOutputTokens,
      },
      safetySettings: Object.entries(this.config.safetySettings).map(([category, threshold]) => ({
        category,
        threshold,
      })),
    });

    this.chat = null;
    this.conversationHistory = [];
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    } catch (error) {
      console.error(`${colors.red}Error loading config: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  loadContext() {
    try {
      if (fs.existsSync(this.contextPath)) {
        return JSON.parse(fs.readFileSync(this.contextPath, 'utf-8'));
      }
    } catch (error) {
      console.warn(`${colors.yellow}Could not load context: ${error.message}${colors.reset}`);
    }
    return null;
  }

  loadGuidelines() {
    try {
      if (fs.existsSync(this.guidelinesPath)) {
        return fs.readFileSync(this.guidelinesPath, 'utf-8');
      }
    } catch (error) {
      console.warn(`${colors.yellow}Could not load guidelines: ${error.message}${colors.reset}`);
    }
    return '';
  }

  loadConstitution() {
    try {
      if (fs.existsSync(this.constitutionPath)) {
        return fs.readFileSync(this.constitutionPath, 'utf-8');
      }
    } catch (error) {
      console.warn(`${colors.yellow}Could not load constitution: ${error.message}${colors.reset}`);
    }
    return '';
  }

  buildSystemPrompt() {
    let systemPrompt = '';

    if (this.guidelines) {
      systemPrompt += `# GUIDELINES\n\n${this.guidelines}\n\n`;
    }

    if (this.constitution) {
      systemPrompt += `# PROJECT CONSTITUTION\n\n${this.constitution}\n\n`;
    }

    if (this.context && this.context.conversationSummary) {
      systemPrompt += `# CONTEXT FROM PREVIOUS SESSION (Claude)\n\n`;
      systemPrompt += `Last Agent: ${this.context.lastAgent}\n`;
      systemPrompt += `Summary: ${this.context.conversationSummary}\n\n`;

      if (this.context.currentFeature) {
        systemPrompt += `Current Feature: ${this.context.currentFeature}\n`;
      }

      if (this.context.currentBranch) {
        systemPrompt += `Current Branch: ${this.context.currentBranch}\n`;
      }

      if (this.context.pendingTasks && this.context.pendingTasks.length > 0) {
        systemPrompt += `\nPending Tasks:\n`;
        this.context.pendingTasks.forEach((task, i) => {
          systemPrompt += `${i + 1}. ${task}\n`;
        });
      }

      if (this.context.recentFiles && this.context.recentFiles.length > 0) {
        systemPrompt += `\nRecent Files:\n`;
        this.context.recentFiles.forEach(file => {
          systemPrompt += `- ${file}\n`;
        });
      }

      systemPrompt += `\n---\n\n`;
    }

    systemPrompt += `You are now continuing the conversation. Follow the guidelines above and maintain continuity with the previous session.`;

    return systemPrompt;
  }

  async startChat() {
    const systemPrompt = this.buildSystemPrompt();

    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I have loaded the guidelines, constitution, and context from the previous Claude session. I am ready to continue the work. What would you like me to help with?' }],
        },
      ],
    });

    console.log(`\n${colors.bright}${colors.green}Gemini Chat Session Started${colors.reset}`);
    console.log(`${colors.dim}Model: ${this.config.model}${colors.reset}`);

    if (this.context && this.context.conversationSummary) {
      console.log(`${colors.blue}Context loaded from Claude session${colors.reset}`);
    }

    console.log(`${colors.dim}Type 'exit' to quit, 'save' to save state${colors.reset}\n`);
  }

  async sendMessage(userMessage) {
    try {
      const result = await this.chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();

      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      this.conversationHistory.push({
        role: 'model',
        content: text,
        timestamp: new Date().toISOString(),
      });

      return text;
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  saveContext(summary = '') {
    const updatedContext = {
      lastUpdated: new Date().toISOString(),
      lastAgent: 'gemini',
      conversationSummary: summary || this.generateSummary(),
      currentFeature: this.context?.currentFeature || null,
      currentBranch: this.context?.currentBranch || 'main',
      completedTasks: this.context?.completedTasks || [],
      pendingTasks: this.context?.pendingTasks || [],
      recentFiles: this.context?.recentFiles || [],
      notes: this.conversationHistory.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 200),
        timestamp: msg.timestamp,
      })),
    };

    fs.writeFileSync(this.contextPath, JSON.stringify(updatedContext, null, 2));
    console.log(`${colors.green}✅ Context saved to ${this.contextPath}${colors.reset}`);
  }

  generateSummary() {
    if (this.conversationHistory.length === 0) {
      return 'No conversation yet';
    }

    const lastMessages = this.conversationHistory.slice(-4);
    const summaryText = lastMessages
      .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`)
      .join(' | ');

    return summaryText;
  }
}

async function main() {
  // Check for API key
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error(`${colors.red}Error: GOOGLE_GEMINI_API_KEY not found in .env${colors.reset}`);
    console.log(`${colors.yellow}Get your API key from: https://aistudio.google.com/app/apikey${colors.reset}`);
    process.exit(1);
  }

  const session = new GeminiChatSession();
  await session.startChat();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.cyan}You: ${colors.reset}`,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input.toLowerCase() === 'exit') {
      console.log(`\n${colors.yellow}Saving context before exit...${colors.reset}`);
      session.saveContext();
      console.log(`${colors.green}Goodbye!${colors.reset}`);
      rl.close();
      process.exit(0);
    }

    if (input.toLowerCase() === 'save') {
      session.saveContext();
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'help') {
      console.log(`\n${colors.bright}Available commands:${colors.reset}`);
      console.log(`  ${colors.cyan}exit${colors.reset}  - Save and exit`);
      console.log(`  ${colors.cyan}save${colors.reset}  - Save current context`);
      console.log(`  ${colors.cyan}help${colors.reset}  - Show this help\n`);
      rl.prompt();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      const response = await session.sendMessage(input);
      console.log(`\n${colors.magenta}Gemini: ${colors.reset}${response}\n`);
    } catch (error) {
      console.error(`\n${colors.red}Error: ${error.message}${colors.reset}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    session.saveContext();
    console.log(`\n${colors.green}Session ended. Context saved.${colors.reset}`);
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { GeminiChatSession };
