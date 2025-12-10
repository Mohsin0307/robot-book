#!/usr/bin/env node

/**
 * Gemini to Claude Context Import
 * This script displays Gemini's current state for Claude to understand
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function displayContext() {
  log('\n🔄 Loading context from Gemini for Claude', colors.bright + colors.blue);
  log('=' .repeat(60), colors.blue);

  const contextPath = path.join(process.cwd(), '.gemini', 'state', 'context.json');

  if (!fs.existsSync(contextPath)) {
    log('\n⚠️  No context file found', colors.yellow);
    log('   Run: npm run claude:export first', colors.reset);
    return;
  }

  try {
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));

    log('\n📋 Context from Gemini:', colors.bright);
    log(`   Last Agent: ${context.lastAgent}`, colors.reset);
    log(`   Last Updated: ${new Date(context.lastUpdated).toLocaleString()}`, colors.reset);

    if (context.conversationSummary) {
      log(`\n   📝 Summary: ${context.conversationSummary}`, colors.green);
    }

    if (context.currentFeature) {
      log(`\n   📂 Current Feature: ${context.currentFeature}`, colors.blue);
    }

    log(`   🌿 Current Branch: ${context.currentBranch}`, colors.blue);

    if (context.completedTasks && context.completedTasks.length > 0) {
      log(`\n   ✅ Completed Tasks (${context.completedTasks.length}):`, colors.green);
      context.completedTasks.forEach((task, i) => {
        log(`      ${i + 1}. ${task}`, colors.reset);
      });
    }

    if (context.pendingTasks && context.pendingTasks.length > 0) {
      log(`\n   ⏳ Pending Tasks (${context.pendingTasks.length}):`, colors.yellow);
      context.pendingTasks.forEach((task, i) => {
        log(`      ${i + 1}. ${task}`, colors.reset);
      });
    }

    if (context.recentFiles && context.recentFiles.length > 0) {
      log(`\n   📄 Recent Files:`, colors.blue);
      context.recentFiles.forEach(file => {
        log(`      - ${file}`, colors.reset);
      });
    }

    if (context.notes && context.notes.length > 0) {
      log(`\n   📝 Recent Notes:`, colors.blue);
      context.notes.forEach((note, i) => {
        const timestamp = new Date(note.timestamp).toLocaleTimeString();
        log(`      [${timestamp}] ${note.role}: ${note.content.substring(0, 100)}...`, colors.reset);
      });
    }

    log('\n💡 Claude can now continue from where Gemini stopped!', colors.green);
    log('=' .repeat(60), colors.blue);
  } catch (error) {
    log(`\n❌ Error reading context: ${error.message}`, colors.red);
  }
}

// Run the script
if (require.main === module) {
  displayContext();
}

module.exports = { displayContext };
