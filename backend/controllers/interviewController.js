const Interview = require('../models/Interview');

// Start Interview
exports.startInterview = async (req, res) => {
  try {
    const { candidateName, candidateEmail, interviewerId } = req.body;

    const interview = await Interview.create({
      candidateName,
      candidateEmail,
      interviewerId: interviewerId || null,
      startTime: new Date()
    });

    res.status(201).json({ message: 'Interview started', interview });
  } catch (err) {
    res.status(500).json({ message: 'Error starting interview', error: err.message });
  }
};

// End Interview
exports.endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, integrityScore, focusLostCount, suspiciousEvents } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      id,
      {
        endTime: new Date(),
        duration,
        integrityScore,
        focusLostCount,
        suspiciousEvents,
        status: 'completed'
      },
      { new: true }
    );

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    res.json({ message: 'Interview ended', interview });
  } catch (err) {
    res.status(500).json({ message: 'Error ending interview', error: err.message });
  }
};

// Get Interview by ID
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('interviewerId', 'name email');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching interview', error: err.message });
  }
};

// Get all interviews (role-based)
exports.getAllInterviews = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'interviewer') query.interviewerId = req.user.userId;
    else query.candidateEmail = req.user.email;

    const interviews = await Interview.find(query)
      .populate('interviewerId', 'name email')
      .sort({ startTime: -1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching interviews', error: err.message });
  }
};
