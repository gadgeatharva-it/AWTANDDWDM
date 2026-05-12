const express = require('express');
const {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
  getRegistrationActivity,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', protect, registerForEvent);
router.delete('/cancel/:eventId', protect, cancelRegistration);
router.get('/my', protect, getMyRegistrations);
router.get('/event/:eventId', protect, getEventAttendees);
router.get('/activity', protect, getRegistrationActivity);

module.exports = router;
