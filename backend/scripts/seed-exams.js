/**
 * Script to seed exam data for testing
 * 
 * Usage:
 * node seed-exams.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('../models/Exam');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedExams();
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

// Function to seed exam data
async function seedExams() {
  try {
    // Delete existing exams
    await Exam.deleteMany({});
    console.log('Deleted existing exams');
    
    const exams = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Create exams for the current month
    for (const subject of subjects) {
      // Create an exam for the current month (end of month)
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
      const examDate = new Date(currentYear, currentMonth - 1, lastDayOfMonth);
      
      exams.push({
        name: `${subject} Monthly Exam - ${currentMonth}/${currentYear}`,
        subject,
        date: examDate,
        semester: 1,
        month: currentMonth,
        year: currentYear,
        attendanceThreshold: 70
      });
    }
    
    // Create exams for the next month
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    
    for (const subject of subjects) {
      // Create an exam for the next month (end of month)
      const lastDayOfNextMonth = new Date(nextMonthYear, nextMonth, 0).getDate();
      const examDate = new Date(nextMonthYear, nextMonth - 1, lastDayOfNextMonth);
      
      exams.push({
        name: `${subject} Monthly Exam - ${nextMonth}/${nextMonthYear}`,
        subject,
        date: examDate,
        semester: 1,
        month: nextMonth,
        year: nextMonthYear,
        attendanceThreshold: 70
      });
    }
    
    // Create exams for the previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    for (const subject of subjects) {
      // Create an exam for the previous month (end of month)
      const lastDayOfPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();
      const examDate = new Date(prevMonthYear, prevMonth - 1, lastDayOfPrevMonth);
      
      exams.push({
        name: `${subject} Monthly Exam - ${prevMonth}/${prevMonthYear}`,
        subject,
        date: examDate,
        semester: 1,
        month: prevMonth,
        year: prevMonthYear,
        attendanceThreshold: 70
      });
    }
    
    // Insert exams
    await Exam.insertMany(exams);
    
    console.log(`Successfully seeded ${exams.length} exams`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding exams:', err);
    process.exit(1);
  }
}