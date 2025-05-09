/**
 * Script to generate dummy attendance data for all students until the end of June
 * 
 * Usage:
 * node generate-attendance-till-june.js
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
  generateAttendanceData();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// List of subjects
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

// Function to generate a random date between two dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate a random attendance status with a bias towards present
function randomStatus(presentProbability = 0.8) {
  return Math.random() < presentProbability ? 'present' : 'absent';
}

// Function to generate attendance data
async function generateAttendanceData() {
  try {
    // Get all students
    const students = await User.find({ role: 'student' });
    if (students.length === 0) {
      console.log('No students found. Please create some students first.');
      process.exit(0);
    }
    
    // Get all teachers
    const teachers = await User.find({ role: 'teacher' });
    if (teachers.length === 0) {
      console.log('No teachers found. Please create some teachers first.');
      process.exit(0);
    }
    
    console.log(`Found ${students.length} students and ${teachers.length} teachers`);
    
    // Define date range
    const startDate = new Date(); // Today
    const endDate = new Date(2024, 5, 30); // June 30, 2024
    
    // Calculate the number of days between start and end dates
    const dayDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`Generating attendance data for ${dayDifference} days`);
    
    // Create attendance records
    const attendanceRecords = [];
    
    // For each student
    for (const student of students) {
      console.log(`Generating attendance for student: ${student.name}`);
      
      // For each subject
      for (const subject of subjects) {
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
    }
    
    // We'll keep existing attendance records
    console.log('Preserving existing attendance records...');
    
    // Insert new attendance records
    console.log(`Inserting ${attendanceRecords.length} attendance records...`);
    
    // Insert in smaller batches to avoid memory issues
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      try {
        const batch = attendanceRecords.slice(i, i + batchSize);
        await Attendance.insertMany(batch, { ordered: false }); // Continue on error
        successCount += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(attendanceRecords.length / batchSize)}`);
      } catch (err) {
        // If some documents were inserted before the error
        if (err.insertedDocs && err.insertedDocs.length > 0) {
          successCount += err.insertedDocs.length;
          errorCount += (batchSize - err.insertedDocs.length);
        } else {
          errorCount += batchSize;
        }
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, err.message);
      }
    }
    
    console.log(`Successfully inserted ${successCount} records, ${errorCount} failed.`);
    
    console.log('Attendance data generation completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error generating attendance data:', err);
    process.exit(1);
  }
}