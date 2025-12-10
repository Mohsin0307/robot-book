#!/usr/bin/env node

/**
 * Gemini CLI Initialization Script
 * This script initializes the Gemini CLI environment and loads context from Claude
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
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

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    log('⚠️  No .env file found. Creating from .env.example...', colors.yellow);
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Created .env file. Please add your GOOGLE_GEMINI_API_KEY.', colors.green);
      return false;
    } else {
      log('❌ No .env.example found. Please create .env manually.', colors.red);
      return false;
    }
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('GOOGLE_GEMINI_API_KEY') || envContent.includes('your_api_key_here')) {
    log('⚠️  Please set GOOGLE_GEMINI_API_KEY in .env file', colors.yellow);
    log('   Get your API key from: https://aistudio.google.com/app/apikey', colors.blue);
    return false;
  }

  return true;
}

function loadClaudeContext() {
  const contextPath = path.join(process.cwd(), '.gemini', 'state', 'context.json');

  log('\n🔄 Loading context from Claude...', colors.blue);

  if (!fs.existsSync(contextPath)) {
    log('⚠️  No context file found. Starting fresh.', colors.yellow);
    return null;
  }

  try {
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));

    if (context.conversationSummary) {
      log(`📝 Last conversation: ${context.conversationSummary}`, colors.green);
    }

    if (context.currentFeature) {
      log(`📂 Current feature: ${context.currentFeature}`, colors.green);
    }

    if (context.currentBranch) {
      log(`🌿 Current branch: ${context.currentBranch}`, colors.green);
    }

    if (context.pendingTasks && context.pendingTasks.length > 0) {
      log(`\n✅ Pending tasks (${context.pendingTasks.length}):`, colors.yellow);
      context.pendingTasks.forEach((task, i) => {
        log(`   ${i + 1}. ${task}`, colors.reset);
      });
    }

    if (context.recentFiles && context.recentFiles.length > 0) {
      log(`\n📄 Recent files:`, colors.blue);
      context.recentFiles.forEach(file => {
        log(`   - ${file}`, colors.reset);
      });
    }

    return context;
  } catch (error) {
    log(`❌ Error loading context: ${error.message}`, colors.red);
    return null;
  }
}

function checkDependencies() {
  log('\n📦 Checking dependencies...', colors.blue);

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('⚠️  No package.json found. Run: npm init', colors.yellow);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasSdk = packageJson.dependencies?.['@google/generative-ai'] ||
                 packageJson.devDependencies?.['@google/generative-ai'];

  if (!hasSdk) {
    log('⚠️  @google/generative-ai not found. Installing...', colors.yellow);
    try {
      execSync('npm install @google/generative-ai', { stdio: 'inherit' });
      log('✅ Installed @google/generative-ai', colors.green);
    } catch (error) {
      log('❌ Failed to install @google/generative-ai', colors.red);
      return false;
    }
  } else {
    log('✅ @google/generative-ai is installed', colors.green);
  }

  return true;
}

function displayGuidelines() {
  const guidelinesPath = path.join(process.cwd(), '.gemini', 'rules', 'guidelines.md');

  if (fs.existsSync(guidelinesPath)) {
    log('\n📋 Gemini Guidelines loaded from:', colors.blue);
    log(`   ${guidelinesPath}`, colors.reset);
  }
}

function main() {
  log('\n🚀 Initializing Gemini CLI for Spec-Driven Development', colors.bright + colors.blue);
  log('=' .repeat(60), colors.blue);

  // Step 1: Check environment
  const envOk = checkEnvFile();
  if (!envOk) {
    log('\n⚠️  Please configure your .env file and run this script again.', colors.yellow);
    process.exit(1);
  }

  // Step 2: Check dependencies
  const depsOk = checkDependencies();
  if (!depsOk) {
    process.exit(1);
  }

  // Step 3: Load Claude context
  const context = loadClaudeContext();

  // Step 4: Display guidelines
  displayGuidelines();

  // Step 5: Ready to go
  log('\n✅ Gemini CLI is ready!', colors.green);
  log('\n📚 Next steps:', colors.bright);
  log('   1. Run: npm run gemini:chat', colors.reset);
  log('   2. Gemini will automatically load context from Claude', colors.reset);
  log('   3. All work will be saved to shared state', colors.reset);

  if (context && context.pendingTasks && context.pendingTasks.length > 0) {
    log('\n💡 Suggested: Continue with the pending tasks listed above', colors.yellow);
  }

  log('\n' + '=' .repeat(60), colors.blue);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { loadClaudeContext, checkEnvFile, checkDependencies };
