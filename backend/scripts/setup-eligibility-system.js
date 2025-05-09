/**
 * Script to set up the eligibility system
 * 
 * This script will:
 * 1. Seed exam data
 * 2. Generate attendance data for the current month
 * 3. Calculate eligibility for all exams
 * 
 * Usage:
 * node setup-eligibility-system.js
 */

const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Setting up eligibility system...');

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
async function setupEligibilitySystem() {
  try {
    // Step 1: Seed exam data
    await runScript('scripts/seed-exams.js');
    
    // Step 2: Generate attendance data for the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    await runScript('scripts/generate-monthly-attendance.js', [
      `--month=${currentMonth}`,
      `--year=${currentYear}`,
      '--attendance-rate=80'
    ]);
    
    // Step 3: Calculate eligibility for all exams
    await runScript('scripts/calculate-eligibility.js', [
      `--month=${currentMonth}`,
      `--year=${currentYear}`,
      '--threshold=70'
    ]);
    
    console.log('Eligibility system setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up eligibility system:', err);
    process.exit(1);
  }
}

// Run the setup
setupEligibilitySystem();