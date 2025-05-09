/**
 * Script to generate dummy attendance data for a specific month
 * 
 * Usage:
 * node generate-monthly-attendance.js --month=5 --year=2023 --students=all --subjects=all
 * 
 * Options:
 * --month: Month number (1-12)
 * --year: Year (e.g., 2023)
 * --students: 'all' for all students, or a comma-separated list of student IDs
 * --subjects: 'all' for all subjects, or a comma-separated list of subject names
 * --attendance-rate: Average attendance rate (0-100, default: 80)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
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
  .option('attendance-rate', {
    description: 'Average attendance rate (0-100)',
    type: 'number',
    default: 80
  })
  .check((argv) => {
    if (argv.month < 1 || argv.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (argv.year < 2000 || argv.year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }
    if (argv['attendance-rate'] < 0 || argv['attendance-rate'] > 100) {
      throw new Error('Attendance rate must be between 0 and 100');
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
  generateAttendanceData();
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

// Function to get all days in a month
function getDaysInMonth(month, year) {
  // Month is 1-based in the argument but 0-based in Date constructor
  return new Date(year, month, 0).getDate();
}

// Function to check if a date is a weekend (Saturday or Sunday)
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

// Function to generate random attendance data
async function generateAttendanceData() {
  try {
    // Get the month and year from command line arguments
    const month = argv.month;
    const year = argv.year;
    const attendanceRate = argv['attendance-rate'] / 100;
    
    // Get the number of days in the month
    const daysInMonth = getDaysInMonth(month, year);
    console.log(`Generating attendance data for ${month}/${year} (${daysInMonth} days)`);
    
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
    
    // Get teachers
    const teachers = await User.find({ role: 'teacher' });
    
    if (teachers.length === 0) {
      console.error('No teachers found. Please add some teachers first.');
      process.exit(1);
    }
    
    console.log(`Found ${teachers.length} teachers`);
    
    // Delete existing attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const deleteResult = await Attendance.deleteMany({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} existing attendance records for ${month}/${year}`);
    
    // Generate attendance records
    const attendanceRecords = [];
    
    for (const student of students) {
      console.log(`Generating attendance for student: ${student.name} (${student._id})`);
      
      for (const subject of subjects) {
        // Assign a random teacher for this subject
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day);
          
          // Skip weekends
          if (isWeekend(date)) {
            continue;
          }
          
          // Randomly decide if the student was present based on the attendance rate
          const status = Math.random() < attendanceRate ? 'present' : 'absent';
          
          attendanceRecords.push({
            student: student._id,
            date,
            status,
            subject,
            markedBy: teacher._id
          });
        }
      }
    }
    
    // Insert attendance records in batches
    const batchSize = 100;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await Attendance.insertMany(batch, { ordered: false });
      console.log(`Inserted ${batch.length} attendance records (${i + batch.length}/${attendanceRecords.length})`);
    }
    
    console.log(`Successfully generated ${attendanceRecords.length} attendance records for ${month}/${year}`);
    
    // Calculate and display attendance statistics
    console.log('\nAttendance Statistics:');
    
    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(record => record.student.toString() === student._id.toString());
      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(record => record.status === 'present').length;
      const attendancePercentage = (presentDays / totalDays) * 100;
      
      console.log(`${student.name}: ${presentDays}/${totalDays} days (${attendancePercentage.toFixed(2)}%)`);
      
      // Subject-wise statistics
      for (const subject of subjects) {
        const subjectAttendance = studentAttendance.filter(record => record.subject === subject);
        const subjectTotalDays = subjectAttendance.length;
        const subjectPresentDays = subjectAttendance.filter(record => record.status === 'present').length;
        const subjectAttendancePercentage = (subjectPresentDays / subjectTotalDays) * 100;
        
        console.log(`  - ${subject}: ${subjectPresentDays}/${subjectTotalDays} days (${subjectAttendancePercentage.toFixed(2)}%)`);
        
        // Check eligibility
        const isEligible = subjectAttendancePercentage >= 70;
        console.log(`    Eligibility: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      }
    }
    
    console.log('\nAttendance data generation completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error generating attendance data:', err);
    process.exit(1);
  }
}