/**
 * Script to fix attendance data for all subjects until June
 * 
 * This script will:
 * 1. Delete all existing attendance records
 * 2. Delete all existing eligibility records
 * 3. Drop the attendance collection to remove any indexes
 * 4. Recreate the attendance model
 * 5. Generate new attendance records for all subjects until June
 * 
 * Usage:
 * node fix-attendance-data.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  fixAttendanceData();
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

// Function to fix attendance data
async function fixAttendanceData() {
  try {
    // Step 1: Drop the attendance collection to remove any indexes
    console.log('Dropping attendance collection...');
    await mongoose.connection.db.dropCollection('attendances');
    
    // Step 2: Delete all eligibility records
    console.log('Deleting all eligibility records...');
    await mongoose.connection.db.collection('eligibilities').deleteMany({});
    
    // Step 3: Recreate the attendance model
    console.log('Recreating attendance model...');
    const AttendanceSchema = new mongoose.Schema({
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      date: {
        type: Date,
        required: true,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
      },
      subject: {
        type: String,
        enum: ALL_SUBJECTS,
        required: true
      },
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });
    
    // Create a compound index to ensure a student can only have one attendance record per day per subject
    AttendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });
    
    const Attendance = mongoose.model('Attendance', AttendanceSchema);
    
    // Step 4: Get all students and teachers
    const User = require('../models/User');
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
    
    // Step 5: Generate attendance data for each student
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
    console.error('Error fixing attendance data:', err);
    process.exit(1);
  }
}