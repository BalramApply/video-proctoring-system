const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  type: {
    type: String,
    enum: ['focus_lost', 'unauthorized_item', 'multiple_people', 'noise_detected', 'other'],
    required: true
  },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  timeInInterview: { type: Number, required: true }, // in seconds
  confidence: { type: Number, min: 0, max: 1 },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Detection', detectionSchema);
