/**
 * Script to calculate eligibility for all months with attendance data
 * 
 * Usage:
 * node calculate-all-eligibility.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Eligibility = require('../models/Eligibility');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  calculateAllEligibility();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// List of all available subjects
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

// Default attendance threshold
const DEFAULT_THRESHOLD = 70;

// Function to calculate eligibility for all months
async function calculateAllEligibility() {
  try {
    // Get all students
    const students = await User.find({ role: 'student' });
    if (students.length === 0) {
      console.error('No students found. Please add some students first.');
      process.exit(1);
    }
    
    console.log(`Found ${students.length} students`);
    
    // Get all attendance records
    const attendanceRecords = await Attendance.find({}).sort({ date: 1 });
    if (attendanceRecords.length === 0) {
      console.error('No attendance records found. Please add some attendance records first.');
      process.exit(1);
    }
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    // Get unique months and years from attendance records
    const monthYears = new Set();
    attendanceRecords.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      monthYears.add(`${month}-${year}`);
    });
    
    console.log(`Found attendance records for ${monthYears.size} month-year combinations`);
    
    // Process each month-year combination
    for (const monthYear of monthYears) {
      const [month, year] = monthYear.split('-').map(Number);
      console.log(`\nProcessing month ${month}/${year}`);
      
      // Process each subject
      for (const subject of ALL_SUBJECTS) {
        console.log(`\nProcessing subject: ${subject}`);
        
        // Get or create exam for this month/year/subject
        let exam = await Exam.findOne({
          subject,
          month,
          year
        });
        
        if (!exam) {
          // Create a new exam
          const lastDayOfMonth = new Date(year, month, 0).getDate();
          const examDate = new Date(year, month - 1, lastDayOfMonth);
          
          exam = await Exam.create({
            name: `${subject} Exam - ${month}/${year}`,
            subject,
            date: examDate,
            semester: 1, // Default semester
            month,
            year,
            attendanceThreshold: DEFAULT_THRESHOLD
          });
          
          console.log(`Created new exam: ${exam.name} on ${exam.date.toISOString().split('T')[0]}`);
        } else {
          console.log(`Using existing exam: ${exam.name} on ${exam.date.toISOString().split('T')[0]}`);
        }
        
        // Calculate eligibility for each student
        for (const student of students) {
          console.log(`Calculating eligibility for student: ${student.name} (${student._id})`);
          
          // Get attendance records for this student, subject, and month
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0);
          
          const studentAttendance = await Attendance.find({
            student: student._id,
            subject,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          });
          
          const totalClasses = studentAttendance.length;
          const attendedClasses = studentAttendance.filter(record => record.status === 'present').length;
          const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
          const isEligible = attendancePercentage >= DEFAULT_THRESHOLD;
          
          console.log(`  - ${subject}: ${attendedClasses}/${totalClasses} classes (${attendancePercentage.toFixed(2)}%)`);
          console.log(`    Eligibility: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
          
          // Skip if no classes for this subject
          if (totalClasses === 0) {
            console.log(`    Skipping - no classes for this subject`);
            continue;
          }
          
          // Create or update eligibility record
          const eligibilityData = {
            student: student._id,
            exam: exam._id,
            subject,
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
            subject
          });
          
          if (existingEligibility) {
            // Update existing record
            await Eligibility.findByIdAndUpdate(existingEligibility._id, eligibilityData);
            console.log(`    Updated existing eligibility record`);
          } else {
            // Create new record
            await Eligibility.create(eligibilityData);
            console.log(`    Created new eligibility record`);
          }
        }
      }
    }
    
    console.log(`\nEligibility calculation completed successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Error calculating eligibility:', err);
    process.exit(1);
  }
}