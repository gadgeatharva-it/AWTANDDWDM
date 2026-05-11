const express = require('express');
const { body } = require('express-validator');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getStats,
} = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

// GET /api/events/stats  — must be BEFORE /:id to avoid conflict
router.get('/stats', protect, getStats);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', protect, restrictTo('organiser', 'admin'), eventValidation, createEvent);
router.put('/:id', protect, restrictTo('organiser', 'admin'), eventValidation, updateEvent);
router.delete('/:id', protect, restrictTo('organiser', 'admin'), deleteEvent);

module.exports = router;
