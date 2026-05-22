const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.isActive === false) return res.status(401).json({ message: 'Account is deactivated' });
    if (user.passwordChangedAt && decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
      return res.status(401).json({ message: 'Password changed recently. Please log in again.' });
    }

    req.user = { id: user._id.toString(), role: user.role, name: user.name };
    next();
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }
  next();
};
