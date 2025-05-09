const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      usn, 
      section, 
      semester, 
      subject 
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Check if USN already exists (for students)
    if (role === 'student' && usn) {
      const usnExists = await User.findOne({ usn });
      if (usnExists) {
        return res.status(400).json({
          success: false,
          error: 'USN already exists'
        });
      }
    }

    // Create user with role-specific fields
    const userData = {
      name,
      email,
      password,
      role
    };

    // Add student-specific fields
    if (role === 'student') {
      userData.usn = usn;
      userData.section = section;
      userData.semester = semester;
    }

    // Add teacher-specific fields
    if (role === 'teacher') {
      userData.subject = subject;
    }

    const user = await User.create(userData);

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update current user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
router.put('/updateprofile', protect, async (req, res) => {
  try {
    const { name, email, subject } = req.body;
    
    // Create update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    
    // Add subject for teachers
    if (req.user.role === 'teacher' && subject) {
      updateFields.subject = subject;
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Create user object with common fields
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  // Add student-specific fields
  if (user.role === 'student') {
    userResponse.usn = user.usn;
    userResponse.section = user.section;
    userResponse.semester = user.semester;
  }

  // Add teacher-specific fields
  if (user.role === 'teacher') {
    userResponse.subject = user.subject;
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse
  });
};

module.exports = router;