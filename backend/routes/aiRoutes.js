const express = require('express');

const router = express.Router();

const {
  attendeeChat,
  organizerCopilot,
} = require('../controllers/aiController');

router.post(
  '/attendee-chat',
  attendeeChat
);

router.post(
  '/organizer-copilot',
  organizerCopilot
);

module.exports = router;