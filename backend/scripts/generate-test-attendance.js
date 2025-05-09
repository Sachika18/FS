/**
 * Script to generate test attendance data for the test users
 * 
 * Usage:
 * node generate-test-attendance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  generateTestAttendance();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// List of all subjects
const subjects = [
  'FullStack',
  'Software Testing',
  'Telecommunication',
  'Data Science',
  'Machine Learning',
  'Artificial Intelligence',
  'Computer Networks',
  'Database Management'
];

// Function to generate a random attendance status with a bias towards present
function randomStatus(presentProbability = 0.8) {
  return Math.random() < presentProbability ? 'present' : 'absent';
}

// Function to generate attendance data for test users
async function generateTestAttendance() {
  try {
    // Find the test student
    const student = await User.findOne({ email: 'student@test.com' });
    if (!student) {
      console.log('Test student not found. Please run create-test-users.js first.');
      process.exit(1);
    }
    
    // Find the test teacher
    const teacher = await User.findOne({ email: 'teacher@test.com' });
    if (!teacher) {
      console.log('Test teacher not found. Please run create-test-users.js first.');
      process.exit(1);
    }
    
    console.log(`Generating attendance for test student: ${student.name}`);
    
    // Define date range
    const startDate = new Date(2024, 0, 1); // January 1, 2024
    const endDate = new Date(2024, 5, 30); // June 30, 2024
    
    // Calculate the number of days between start and end dates
    const dayDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`Generating attendance data for ${dayDifference} days`);
    
    // Create attendance records
    const attendanceRecords = [];
    
    // For each subject
    for (const subject of subjects) {
      // Generate attendance for each weekday (Monday to Friday) until the end date
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Create attendance record with 80% chance of being present
          const status = randomStatus(0.8);
          
          attendanceRecords.push({
            student: student._id,
            date: new Date(currentDate),
            status,
            subject,
            markedBy: teacher._id
          });
        }
        
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    console.log(`Generated ${attendanceRecords.length} attendance records`);
    
    // First, delete existing attendance records for the test student
    console.log(`Deleting existing attendance records for student: ${student.name}`);
    await Attendance.deleteMany({ student: student._id });
    
    // Insert attendance records in batches
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      try {
        const batch = attendanceRecords.slice(i, i + batchSize);
        await Attendance.insertMany(batch);
        successCount += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(attendanceRecords.length / batchSize)}`);
      } catch (err) {
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, err.message);
        // Continue with next batch even if there's an error
      }
    }
    
    console.log(`Successfully inserted ${successCount} attendance records`);
    console.log('Test attendance data generation completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error generating test attendance data:', err);
    process.exit(1);
  }
}