const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Eligibility = require('../models/Eligibility');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get student eligibility for all exams
// @route   GET /api/exams/eligibility/student/:id
// @access  Private
router.get('/eligibility/student/:id', protect, async (req, res) => {
  try {
    // Check if the user is a teacher or the student themselves
    if (req.user.role !== 'teacher' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    const eligibility = await Eligibility.find({ student: req.params.id })
      .populate('exam')
      .sort({ 'exam.date': -1 });
    
    res.status(200).json({
      success: true,
      count: eligibility.length,
      data: eligibility
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { subject, month, year } = req.query;
    
    // Build query
    const query = {};
    
    if (subject) {
      query.subject = subject;
    }
    
    if (month) {
      query.month = month;
    }
    
    if (year) {
      query.year = year;
    }
    
    const exams = await Exam.find(query).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Create exam
// @route   POST /api/exams
// @access  Private/Teacher
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    
    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Teacher
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    await exam.deleteOne();
    
    // Also delete related eligibility records
    await Eligibility.deleteMany({ exam: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get eligibility for a specific exam
// @route   GET /api/exams/:id/eligibility
// @access  Private/Teacher
router.get('/:id/eligibility', protect, authorize('teacher'), async (req, res) => {
  try {
    const eligibility = await Eligibility.find({ exam: req.params.id })
      .populate('student', 'name email usn section semester');
    
    res.status(200).json({
      success: true,
      count: eligibility.length,
      data: eligibility
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Calculate eligibility for an exam
// @route   POST /api/exams/:id/calculate-eligibility
// @access  Private/Teacher
router.post('/:id/calculate-eligibility', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Get all students
    const User = require('../models/User');
    const students = await User.find({ role: 'student' });
    
    // Get attendance records for the month of the exam
    const Attendance = require('../models/Attendance');
    const startDate = new Date(exam.year, exam.month - 1, 1);
    const endDate = new Date(exam.year, exam.month, 0);
    
    const eligibilityResults = [];
    
    for (const student of students) {
      // Get attendance records for this student and subject
      const attendanceRecords = await Attendance.find({
        student: student._id,
        subject: exam.subject,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      const totalClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(record => record.status === 'present').length;
      const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
      const isEligible = attendancePercentage >= exam.attendanceThreshold;
      
      // Create or update eligibility record
      const eligibilityData = {
        student: student._id,
        exam: exam._id,
        subject: exam.subject,
        isEligible,
        attendancePercentage,
        totalClasses,
        attendedClasses,
        calculatedAt: new Date()
      };
      
      // Check if eligibility record already exists
      const existingEligibility = await Eligibility.findOne({
        student: student._id,
        exam: exam._id,
        subject: exam.subject
      });
      
      let eligibility;
      
      if (existingEligibility) {
        // Update existing record
        eligibility = await Eligibility.findByIdAndUpdate(
          existingEligibility._id,
          eligibilityData,
          { new: true }
        );
      } else {
        // Create new record
        eligibility = await Eligibility.create(eligibilityData);
      }
      
      eligibilityResults.push(eligibility);
    }
    
    res.status(200).json({
      success: true,
      count: eligibilityResults.length,
      data: eligibilityResults
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;