const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateName: String,
  candidateEmail: String,
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number,
  videoPath: String,
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  integrityScore: { type: Number, default: 100 },
  focusLostCount: { type: Number, default: 0 },
  suspiciousEvents: { type: Number, default: 0 }
});

module.exports = mongoose.model('Interview', interviewSchema);
