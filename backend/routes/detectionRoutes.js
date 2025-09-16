const express = require('express');
const router = express.Router();
const { logDetection, getDetectionsByInterview } = require('../controllers/detectionController');

// Log a detection event
router.post('/log', logDetection);

// Get all detections for a specific interview
router.get('/:interviewId', getDetectionsByInterview);

module.exports = router;
