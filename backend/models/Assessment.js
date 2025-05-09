const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add assessment name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add assessment date']
  },
  attendanceThreshold: {
    type: Number,
    default: 70,
    min: [0, 'Threshold cannot be less than 0'],
    max: [100, 'Threshold cannot be more than 100']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add start date for attendance calculation']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add end date for attendance calculation']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);