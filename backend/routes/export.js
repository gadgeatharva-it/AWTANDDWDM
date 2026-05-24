const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { exportExecutiveSummaryCsv } = require('../controllers/exportController');

const router = express.Router();

router.get('/executive-summary', protect, restrictTo('organiser'), exportExecutiveSummaryCsv);

module.exports = router;

