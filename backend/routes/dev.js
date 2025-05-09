const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const { protect, authorize } = require('../middleware/auth');

// @desc    Run the eligibility system setup
// @route   POST /api/dev/setup-eligibility
// @access  Private/Teacher
router.post('/setup-eligibility', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the setup script as a child process
    const setupProcess = spawn('node', ['scripts/setup-eligibility-system.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    setupProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Setup output: ${data}`);
    });
    
    setupProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Setup error: ${data}`);
    });
    
    setupProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Eligibility system setup completed successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to set up eligibility system',
          output,
          errorOutput
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Run the attendance seeder
// @route   POST /api/dev/seed-attendance
// @access  Private/Teacher
router.post('/seed-attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the seed script as a child process
    const seedProcess = spawn('node', ['scripts/seed-attendance.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    seedProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Seed output: ${data}`);
    });
    
    seedProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Seed error: ${data}`);
    });
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Attendance data generated successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to generate attendance data',
          output,
          errorOutput
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;