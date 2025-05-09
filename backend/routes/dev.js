const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const { protect, authorize } = require('../middleware/auth');

// @desc    Run the complete system setup with data until June
// @route   POST /api/dev/setup-complete
// @access  Private/Teacher
router.post('/setup-complete', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the setup script as a child process
    const setupProcess = spawn('node', ['scripts/setup-complete-system.js'], {
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
          message: 'Complete system setup completed successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to set up complete system',
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

// @desc    Calculate eligibility for all months with attendance data
// @route   POST /api/dev/calculate-all-eligibility
// @access  Private/Teacher
router.post('/calculate-all-eligibility', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the calculate-all-eligibility script as a child process
    const calculateProcess = spawn('node', ['scripts/calculate-all-eligibility.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    calculateProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Calculate all eligibility output: ${data}`);
    });
    
    calculateProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Calculate all eligibility error: ${data}`);
    });
    
    calculateProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Eligibility calculated for all months successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to calculate eligibility for all months',
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

// @desc    Fix attendance data for all subjects until June
// @route   POST /api/dev/fix-attendance
// @access  Private/Teacher
router.post('/fix-attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the fix-attendance-data script as a child process
    const fixProcess = spawn('node', ['scripts/fix-attendance-data.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    fixProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Fix attendance output: ${data}`);
    });
    
    fixProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Fix attendance error: ${data}`);
    });
    
    fixProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Attendance data fixed and generated successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fix and generate attendance data',
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

// @desc    Reset and generate attendance data for all subjects until June
// @route   POST /api/dev/reset-attendance
// @access  Private/Teacher
router.post('/reset-attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the reset-and-generate-attendance script as a child process
    const resetProcess = spawn('node', ['scripts/reset-and-generate-attendance.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    resetProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Reset attendance output: ${data}`);
    });
    
    resetProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Reset attendance error: ${data}`);
    });
    
    resetProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Attendance data reset and generated successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to reset and generate attendance data',
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

// @desc    Generate test attendance data until June
// @route   POST /api/dev/generate-test-attendance
// @access  Private/Teacher
router.post('/generate-test-attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    // Run the test attendance generator script as a child process
    const seedProcess = spawn('node', ['scripts/generate-test-attendance.js'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    seedProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Test attendance generator output: ${data}`);
    });
    
    seedProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Test attendance generator error: ${data}`);
    });
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Test attendance data generated successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to generate test attendance data',
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