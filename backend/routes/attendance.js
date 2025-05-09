const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Teacher
router.get('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { date, student } = req.query;
    let query = {};
    
    // Filter by date if provided
    if (date) {
      console.log('Date parameter received:', date);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      console.log('Start date:', startDate);
      console.log('End date:', endDate);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Filter by student if provided
    if (student) {
      query.student = student;
    }
    
    const attendance = await Attendance.find(query)
      .populate('student', 'name email')
      .populate('markedBy', 'name');
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get attendance for a specific student
// @route   GET /api/attendance/student/:id
// @access  Private
router.get('/student/:id', protect, async (req, res) => {
  try {
    // Check if the user is a teacher or the student themselves
    if (req.user.role !== 'teacher' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    const attendance = await Attendance.find({ student: req.params.id })
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get attendance statistics for a specific student
// @route   GET /api/attendance/stats/:id
// @access  Private
router.get('/stats/:id', protect, async (req, res) => {
  try {
    // Check if the user is a teacher or the student themselves
    if (req.user.role !== 'teacher' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    // Get all attendance records for the student
    const attendance = await Attendance.find({ student: req.params.id });
    
    // Calculate total days
    const totalDays = attendance.length;
    
    // Calculate present days
    const presentDays = attendance.filter(a => a.status === 'present').length;
    
    // Calculate attendance percentage
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    // Get upcoming assessments
    const assessments = await Assessment.find({
      date: { $gte: new Date() }
    }).sort({ date: 1 });
    
    // Calculate eligibility for each assessment
    const eligibility = await Promise.all(
      assessments.map(async assessment => {
        // Get attendance records between start and end dates
        const assessmentAttendance = await Attendance.find({
          student: req.params.id,
          date: {
            $gte: assessment.startDate,
            $lte: assessment.endDate
          }
        });
        
        const totalAssessmentDays = assessmentAttendance.length;
        const presentAssessmentDays = assessmentAttendance.filter(a => a.status === 'present').length;
        const assessmentPercentage = totalAssessmentDays > 0 ? (presentAssessmentDays / totalAssessmentDays) * 100 : 0;
        
        return {
          assessment: {
            id: assessment._id,
            name: assessment.name,
            date: assessment.date
          },
          attendancePercentage: assessmentPercentage,
          isEligible: assessmentPercentage >= assessment.attendanceThreshold,
          threshold: assessment.attendanceThreshold
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage,
        eligibility
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Mark attendance for a single student
// @route   POST /api/attendance
// @access  Private/Teacher
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { student, date, status } = req.body;
    
    // Check if student exists
    const studentExists = await User.findById(student);
    if (!studentExists || studentExists.role !== 'student') {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    // Format date to remove time component
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if attendance already marked for this student on this date
    const existingAttendance = await Attendance.findOne({
      student,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.markedBy = req.user.id;
      await existingAttendance.save();
      
      return res.status(200).json({
        success: true,
        data: existingAttendance
      });
    }
    
    // Create new attendance record
    const attendance = await Attendance.create({
      student,
      date: attendanceDate,
      status,
      markedBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Mark attendance for multiple students
// @route   POST /api/attendance/bulk
// @access  Private/Teacher
router.post('/bulk', protect, authorize('teacher'), async (req, res) => {
  try {
    const { date, records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of attendance records'
      });
    }
    
    // Format date to remove time component
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const results = [];
    
    // Process each record
    for (const record of records) {
      const { student, status } = record;
      
      // Check if student exists
      const studentExists = await User.findById(student);
      if (!studentExists || studentExists.role !== 'student') {
        results.push({
          student,
          success: false,
          error: 'Student not found'
        });
        continue;
      }
      
      try {
        // Check if attendance already marked for this student on this date
        const existingAttendance = await Attendance.findOne({
          student,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status;
          existingAttendance.markedBy = req.user.id;
          await existingAttendance.save();
          
          results.push({
            student,
            success: true,
            data: existingAttendance
          });
        } else {
          // Create new attendance record
          const attendance = await Attendance.create({
            student,
            date: attendanceDate,
            status,
            markedBy: req.user.id
          });
          
          results.push({
            student,
            success: true,
            data: attendance
          });
        }
      } catch (err) {
        results.push({
          student,
          success: false,
          error: err.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Create a new assessment
// @route   POST /api/attendance/assessment
// @access  Private/Teacher
router.post('/assessment', protect, authorize('teacher'), async (req, res) => {
  try {
    const { name, date, attendanceThreshold, startDate, endDate } = req.body;
    
    const assessment = await Assessment.create({
      name,
      date,
      attendanceThreshold: attendanceThreshold || 70,
      startDate,
      endDate,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get all assessments
// @route   GET /api/attendance/assessment
// @access  Private
router.get('/assessment', protect, async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;