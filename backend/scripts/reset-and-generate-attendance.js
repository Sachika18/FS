/**
 * Script to reset and generate attendance data for all subjects until June
 * 
 * This script will:
 * 1. Delete all existing attendance records
 * 2. Delete all existing eligibility records
 * 3. Generate new attendance records for all subjects until June
 * 
 * Usage:
 * node reset-and-generate-attendance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Eligibility = require('../models/Eligibility');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  resetAndGenerateAttendance();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// List of all subjects
const ALL_SUBJECTS = [
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

// Function to reset and generate attendance data
async function resetAndGenerateAttendance() {
  try {
    // Step 1: Delete all existing attendance records
    console.log('Deleting all existing attendance records...');
    await Attendance.deleteMany({});
    
    // Step 2: Delete all existing eligibility records
    console.log('Deleting all existing eligibility records...');
    await Eligibility.deleteMany({});
    
    // Step 3: Get all students and teachers
    const students = await User.find({ role: 'student' });
    if (students.length === 0) {
      console.log('No students found. Please create some students first.');
      process.exit(0);
    }
    
    const teachers = await User.find({ role: 'teacher' });
    if (teachers.length === 0) {
      console.log('No teachers found. Please create some teachers first.');
      process.exit(0);
    }
    
    console.log(`Found ${students.length} students and ${teachers.length} teachers`);
    
    // Step 4: Generate attendance data for each student
    for (const student of students) {
      console.log(`Generating attendance for student: ${student.name}`);
      
      // Define date range (January 1, 2024 to June 30, 2024)
      const startDate = new Date(2024, 0, 1); // January 1, 2024
      const endDate = new Date(2024, 5, 30); // June 30, 2024
      
      // Calculate the number of days between start and end dates
      const dayDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      console.log(`Generating attendance data for ${dayDifference} days`);
      
      // Create attendance records for each subject
      const attendanceRecords = [];
      
      for (const subject of ALL_SUBJECTS) {
        // Assign a random teacher for this subject
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        
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
      
      console.log(`Generated ${attendanceRecords.length} attendance records for ${student.name}`);
      
      // Insert attendance records in batches
      const batchSize = 100;
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
      
      console.log(`Successfully inserted ${successCount} attendance records for ${student.name}`);
    }
    
    console.log('Attendance data generation completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error generating attendance data:', err);
    process.exit(1);
  }
}