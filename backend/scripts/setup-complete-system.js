/**
 * Script to set up the complete system with data until June
 * 
 * This script will:
 * 1. Create test users
 * 2. Generate attendance data until June
 * 3. Generate exams until June
 * 4. Calculate eligibility for all exams
 * 
 * Usage:
 * node setup-complete-system.js
 */

const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Setting up complete system with data until June...');

// Function to run a script and wait for it to complete
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${scriptPath} ${args.join(' ')}...`);
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${scriptPath} completed successfully`);
        resolve();
      } else {
        console.error(`${scriptPath} failed with code ${code}`);
        reject(new Error(`Script ${scriptPath} failed with code ${code}`));
      }
    });
  });
}

// Main function to run all scripts
async function setupCompleteSystem() {
  try {
    // Step 1: Create test users
    await runScript('scripts/create-test-users.js');
    
    // Step 2: Generate attendance data for test users until June
    await runScript('scripts/generate-test-attendance.js');
    
    // Step 3: Generate exams until June
    await runScript('scripts/generate-exams-till-june.js');
    
    // Step 4: Calculate eligibility for all months with attendance data
    await runScript('scripts/calculate-all-eligibility.js');
    
    console.log('Complete system setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up complete system:', err);
    process.exit(1);
  }
}

// Run the setup
setupCompleteSystem();