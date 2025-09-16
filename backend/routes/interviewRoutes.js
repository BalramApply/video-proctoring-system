const express = require('express');
const { startInterview, endInterview, getInterviewById, getAllInterviews } = require('../controllers/interviewController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', startInterview);
router.post('/:id/end', endInterview);
router.get('/:id', getInterviewById);
router.get('/', authenticateToken, getAllInterviews);

module.exports = router;
