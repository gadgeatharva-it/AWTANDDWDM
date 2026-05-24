const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { listUsers, setUserActive } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, restrictTo('admin', 'organiser'), listUsers);
router.patch('/:id/active', protect, restrictTo('admin', 'organiser'), setUserActive);

module.exports = router;
