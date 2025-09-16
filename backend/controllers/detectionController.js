const Detection = require('../models/Detection');

exports.logDetection = async (req, res) => {
  try {
    const { interviewId, type, message, severity, timeInInterview, confidence, metadata } = req.body;

    // Validation
    if (!interviewId || !type || !message || !timeInInterview) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const detection = new Detection({
      interviewId,
      type,
      message,
      severity,
      timeInInterview,
      confidence,
      metadata
    });

    await detection.save();

    res.status(201).json({
      success: true,
      message: "Detection event logged successfully",
      data: detection
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Optional: Get all detections for an interview
exports.getDetectionsByInterview = async (req, res) => {
  try {
    const detections = await Detection.find({ interviewId: req.params.interviewId }).sort({ createdAt: -1 });
    res.json({ success: true, data: detections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
