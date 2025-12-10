#!/usr/bin/env node

/**
 * Claude to Gemini Context Export
 * This script helps export Claude's current state for Gemini to pick up
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${colors.cyan}${query}${colors.reset} `, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function exportContext() {
  log('\n🔄 Exporting context from Claude to Gemini', colors.bright + colors.blue);
  log('=' .repeat(60), colors.blue);

  const contextPath = path.join(process.cwd(), '.gemini', 'state', 'context.json');

  // Load existing context
  let context = {};
  if (fs.existsSync(contextPath)) {
    context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    log('\n📂 Found existing context file', colors.green);
  }

  log('\n📝 Please provide the following information:\n', colors.bright);

  // Gather information
  const summary = await askQuestion('Brief summary of current work (or Enter to skip):');
  const feature = await askQuestion('Current feature name (or Enter to skip):');
  const branch = await askQuestion('Current branch (or Enter for current):');
  const pendingTasks = await askQuestion('Pending tasks (comma-separated, or Enter to skip):');
  const recentFiles = await askQuestion('Recent files worked on (comma-separated, or Enter to skip):');

  // Update context
  const updatedContext = {
    lastUpdated: new Date().toISOString(),
    lastAgent: 'claude',
    conversationSummary: summary || context.conversationSummary || '',
    currentFeature: feature || context.currentFeature || null,
    currentBranch: branch || context.currentBranch || getCurrentBranch(),
    completedTasks: context.completedTasks || [],
    pendingTasks: pendingTasks
      ? pendingTasks.split(',').map(t => t.trim()).filter(Boolean)
      : context.pendingTasks || [],
    recentFiles: recentFiles
      ? recentFiles.split(',').map(f => f.trim()).filter(Boolean)
      : context.recentFiles || [],
    notes: context.notes || [],
  };

  // Save context
  fs.writeFileSync(contextPath, JSON.stringify(updatedContext, null, 2));

  log('\n✅ Context exported successfully!', colors.green);
  log(`\n📍 Location: ${contextPath}`, colors.blue);

  log('\n📋 Exported context:', colors.bright);
  if (updatedContext.conversationSummary) {
    log(`   Summary: ${updatedContext.conversationSummary}`, colors.reset);
  }
  if (updatedContext.currentFeature) {
    log(`   Feature: ${updatedContext.currentFeature}`, colors.reset);
  }
  log(`   Branch: ${updatedContext.currentBranch}`, colors.reset);
  if (updatedContext.pendingTasks.length > 0) {
    log(`   Pending Tasks (${updatedContext.pendingTasks.length}):`, colors.yellow);
    updatedContext.pendingTasks.forEach((task, i) => {
      log(`      ${i + 1}. ${task}`, colors.reset);
    });
  }
  if (updatedContext.recentFiles.length > 0) {
    log(`   Recent Files:`, colors.blue);
    updatedContext.recentFiles.forEach(file => {
      log(`      - ${file}`, colors.reset);
    });
  }

  log('\n💡 Next steps:', colors.bright);
  log('   1. Switch to Gemini CLI', colors.reset);
  log('   2. Run: npm run gemini:init', colors.reset);
  log('   3. Run: npm run gemini:chat', colors.reset);
  log('   4. Gemini will automatically load this context', colors.reset);

  log('\n' + '=' .repeat(60), colors.blue);
}

function getCurrentBranch() {
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return branch;
  } catch (error) {
    return 'main';
  }
}

// Run the script
if (require.main === module) {
  exportContext().catch(error => {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { exportContext };
