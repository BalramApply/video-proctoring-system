// controllers/reportController.js
const PDFDocument = require('pdfkit');
const Interview = require('../models/Interview');
const Detection = require('../models/Detection');
const generateRecommendations = require('../utils/recommendation');

exports.getReport = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const detections = await Detection.find({ interviewId }).sort({ timestamp: 1 });

    const recommendations = generateRecommendations(interview, detections);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename=report-${interview.candidateName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe PDF stream to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Interview Proctoring Report', { align: 'center' });
    doc.moveDown();

    // Candidate Info
    doc.fontSize(14).text(`Candidate: ${interview.candidateName}`);
    doc.text(`Email: ${interview.candidateEmail}`);
    doc.text(`Interview ID: ${interview._id}`);
    doc.text(`Start: ${interview.startTime}`);
    doc.text(`End: ${interview.endTime}`);
    doc.text(`Duration: ${interview.duration} minutes`);
    doc.text(`Status: ${interview.status}`);
    doc.moveDown();

    // Statistics
    doc.fontSize(16).text('Statistics', { underline: true });
    doc.fontSize(12).text(`Integrity Score: ${interview.integrityScore}`);
    doc.text(`Focus Lost Count: ${interview.focusLostCount}`);
    doc.text(`Suspicious Events: ${interview.suspiciousEvents}`);
    doc.text(`Total Detections: ${detections.length}`);
    doc.moveDown();

    // Detection Summary
    doc.fontSize(16).text('Detection Summary', { underline: true });
    const summaryByType = detections.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {});
    const summaryBySeverity = detections.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {});

    doc.fontSize(12).text('By Type:');
    Object.entries(summaryByType).forEach(([type, count]) => {
      doc.text(` - ${type}: ${count}`);
    });

    doc.moveDown();
    doc.text('By Severity:');
    Object.entries(summaryBySeverity).forEach(([severity, count]) => {
      doc.text(` - ${severity}: ${count}`);
    });
    doc.moveDown();

    // Timeline
    doc.fontSize(16).text('Timeline', { underline: true });
    detections.forEach((det) => {
      const time = Math.floor(det.timeInInterview / 60) + ':' + String(det.timeInInterview % 60).padStart(2, '0');
      doc.fontSize(12).text(`${time} - [${det.severity}] ${det.type}: ${det.message} (Confidence: ${det.confidence})`);
    });
    doc.moveDown();

    // Recommendations
    doc.fontSize(16).text('Recommendations', { underline: true });
    recommendations.forEach((rec, i) => {
      doc.fontSize(12).text(`${i + 1}. ${rec}`);
    });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
};
