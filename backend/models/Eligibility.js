const mongoose = require('mongoose');

const EligibilitySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  subject: {
    type: String,
    enum: ['FullStack', 'Software Testing', 'Telecommunication', 'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Computer Networks', 'Database Management'],
    required: true
  },
  isEligible: {
    type: Boolean,
    required: true
  },
  attendancePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalClasses: {
    type: Number,
    required: true,
    min: 0
  },
  attendedClasses: {
    type: Number,
    required: true,
    min: 0
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure a student can only have one eligibility record per exam per subject
EligibilitySchema.index({ student: 1, exam: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Eligibility', EligibilitySchema);