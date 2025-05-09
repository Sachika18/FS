/**
 * Script to calculate eligibility for exams based on attendance
 * 
 * Usage:
 * node calculate-eligibility.js --month=5 --year=2023 --threshold=70
 * 
 * Options:
 * --month: Month number (1-12)
 * --year: Year (e.g., 2023)
 * --threshold: Attendance threshold percentage (default: 70)
 * --students: 'all' for all students, or a comma-separated list of student IDs
 * --subjects: 'all' for all subjects, or a comma-separated list of subject names
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Eligibility = require('../models/Eligibility');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Load environment variables
dotenv.config();

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('month', {
    description: 'Month number (1-12)',
    type: 'number',
    demandOption: true
  })
  .option('year', {
    description: 'Year',
    type: 'number',
    demandOption: true
  })
  .option('threshold', {
    description: 'Attendance threshold percentage',
    type: 'number',
    default: 70
  })
  .option('students', {
    description: 'Student IDs (comma-separated) or "all"',
    type: 'string',
    default: 'all'
  })
  .option('subjects', {
    description: 'Subject names (comma-separated) or "all"',
    type: 'string',
    default: 'all'
  })
  .check((argv) => {
    if (argv.month < 1 || argv.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (argv.year < 2000 || argv.year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }
    if (argv.threshold < 0 || argv.threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }
    return true;
  })
  .argv;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  calculateEligibility();
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

// Function to calculate eligibility
async function calculateEligibility() {
  try {
    // Get the month and year from command line arguments
    const month = argv.month;
    const year = argv.year;
    const threshold = argv.threshold;
    
    console.log(`Calculating eligibility for ${month}/${year} with threshold ${threshold}%`);
    
    // Get students
    let students;
    if (argv.students === 'all') {
      students = await User.find({ role: 'student' });
    } else {
      const studentIds = argv.students.split(',');
      students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    }
    
    if (students.length === 0) {
      console.error('No students found. Please add some students first or check your student IDs.');
      process.exit(1);
    }
    
    console.log(`Found ${students.length} students`);
    
    // Get subjects
    let subjects;
    if (argv.subjects === 'all') {
      subjects = ALL_SUBJECTS;
    } else {
      subjects = argv.subjects.split(',');
      // Validate subjects
      for (const subject of subjects) {
        if (!ALL_SUBJECTS.includes(subject)) {
          console.error(`Invalid subject: ${subject}`);
          console.error(`Available subjects: ${ALL_SUBJECTS.join(', ')}`);
          process.exit(1);
        }
      }
    }
    
    console.log(`Using ${subjects.length} subjects: ${subjects.join(', ')}`);
    
    // Get or create exams for the month
    const exams = [];
    
    for (const subject of subjects) {
      // Check if exam already exists for this month/year/subject
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
          attendanceThreshold: threshold
        });
        
        console.log(`Created new exam: ${exam.name} on ${exam.date.toISOString().split('T')[0]}`);
      } else {
        console.log(`Using existing exam: ${exam.name} on ${exam.date.toISOString().split('T')[0]}`);
      }
      
      exams.push(exam);
    }
    
    // Calculate eligibility for each student and subject
    const eligibilityRecords = [];
    
    for (const student of students) {
      console.log(`\nCalculating eligibility for student: ${student.name} (${student._id})`);
      
      for (const exam of exams) {
        const subject = exam.subject;
        
        // Get attendance records for this student, subject, and month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const attendanceRecords = await Attendance.find({
          student: student._id,
          subject,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        });
        
        const totalClasses = attendanceRecords.length;
        const attendedClasses = attendanceRecords.filter(record => record.status === 'present').length;
        const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
        const isEligible = attendancePercentage >= threshold;
        
        console.log(`  - ${subject}: ${attendedClasses}/${totalClasses} classes (${attendancePercentage.toFixed(2)}%)`);
        console.log(`    Eligibility: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
        
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
          const newEligibility = await Eligibility.create(eligibilityData);
          eligibilityRecords.push(newEligibility);
          console.log(`    Created new eligibility record`);
        }
      }
    }
    
    console.log(`\nEligibility calculation completed successfully!`);
    console.log(`Created ${eligibilityRecords.length} new eligibility records`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error calculating eligibility:', err);
    process.exit(1);
  }
}