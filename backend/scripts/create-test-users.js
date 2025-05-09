/**
 * Script to create test users for development
 * 
 * Usage:
 * node create-test-users.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  createTestUsers();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to create test users
async function createTestUsers() {
  try {
    // Create a test teacher
    const teacherData = {
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher',
      subject: 'FullStack'
    };
    
    // Check if teacher already exists
    let teacher = await User.findOne({ email: teacherData.email });
    if (!teacher) {
      teacher = await User.create(teacherData);
      console.log('Test teacher created:', teacher.name, teacher.email);
    } else {
      console.log('Test teacher already exists');
    }
    
    // Create a test student
    const studentData = {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      usn: 'TEST001',
      section: 'A',
      semester: 1
    };
    
    // Check if student already exists
    let student = await User.findOne({ email: studentData.email });
    if (!student) {
      student = await User.create(studentData);
      console.log('Test student created:', student.name, student.email);
    } else {
      console.log('Test student already exists');
    }
    
    console.log('Test users created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
}