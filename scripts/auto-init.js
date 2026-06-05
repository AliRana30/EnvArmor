const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Automatically initializes EnvArmor in the project after installation.
 */
function autoInit() {
  if (process.env.VERCEL) {
    console.log('⏭ Skipping EnvArmor auto-initialization on Vercel.');
    return;
  }

  console.log('🚀 Running EnvArmor auto-initialization...');

  try {
    const cliPath = path.join(__dirname, '..', 'envarmor', 'dist', 'bin', 'envarmor.js');
    
    // Check if CLI is built, if not, try to build it first
    if (!fs.existsSync(cliPath)) {
      console.log('📦 CLI not built, building now...');
      execSync('npm run cli:build', { stdio: 'inherit' });
    }

    // Run the init command
    // We use 'node' to execute the JS file directly
    execSync(`node ${cliPath} init`, { stdio: 'inherit' });
    
    console.log('✅ EnvArmor initialized successfully.');
  } catch (error) {
    console.error('❌ EnvArmor auto-initialization failed.');
    console.error('You can try running it manually: npx envarmor init');
    // We don't exit with 1 to avoid blocking the whole install process if init fails
  }
}

autoInit();
