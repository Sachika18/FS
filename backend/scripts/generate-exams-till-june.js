/**
 * Script to generate exams for each month until June
 * 
 * Usage:
 * node generate-exams-till-june.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('../models/Exam');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  generateExams();
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

// Function to generate exams
async function generateExams() {
  try {
    // Delete existing exams
    await Exam.deleteMany({});
    console.log('Deleted existing exams');
    
    const exams = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Generate exams for each month from current month to June
    for (let month = currentMonth; month <= 5; month++) {
      // Create exams for each subject in this month
      for (const subject of subjects) {
        // Create an exam for the end of the month
        const lastDayOfMonth = new Date(currentYear, month + 1, 0).getDate();
        const examDate = new Date(currentYear, month, lastDayOfMonth - 5); // 5 days before end of month
        
        exams.push({
          name: `${subject} Monthly Exam - ${month + 1}/${currentYear}`,
          subject,
          date: examDate,
          semester: 1,
          month: month + 1,
          year: currentYear,
          attendanceThreshold: 70
        });
        
        // For some subjects, add a mid-month exam too
        if (['FullStack', 'Software Testing', 'Data Science'].includes(subject)) {
          const midMonthDate = new Date(currentYear, month, 15);
          
          exams.push({
            name: `${subject} Mid-Month Exam - ${month + 1}/${currentYear}`,
            subject,
            date: midMonthDate,
            semester: 1,
            month: month + 1,
            year: currentYear,
            attendanceThreshold: 70
          });
        }
      }
    }
    
    // Insert exams
    await Exam.insertMany(exams);
    
    console.log(`Successfully generated ${exams.length} exams until June`);
    process.exit(0);
  } catch (err) {
    console.error('Error generating exams:', err);
    process.exit(1);
  }
}