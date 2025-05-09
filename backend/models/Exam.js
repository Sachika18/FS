const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  subject: {
    type: String,
    enum: ['FullStack', 'Software Testing', 'Telecommunication', 'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Computer Networks', 'Database Management'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: true
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  attendanceThreshold: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exam', ExamSchema);