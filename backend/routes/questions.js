const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createQuestion,
  getMyQuestions,
  getInbox,
  answerQuestion,
} = require('../controllers/questionController');

const router = express.Router();

router.post('/', protect, createQuestion);
router.get('/my', protect, getMyQuestions);
router.get('/inbox', protect, getInbox);
router.patch('/:id/answer', protect, answerQuestion);

module.exports = router;

