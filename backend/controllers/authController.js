const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { passwordResetEmailTemplate } = require('../utils/emailTemplates');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

function normalizeRole(role) {
  if (role === 'organizer') return 'organiser';
  if (role === 'organiser' || role === 'attendee' || role === 'admin') return role;
  return 'attendee';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function buildClientUrl(pathname) {
  const base = String(process.env.CLIENT_URL || '').replace(/\/+$/, '');
  if (!base) return pathname;
  return `${base}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

async function sendPasswordResetEmail({ user, rawToken }) {
  const appName = process.env.APP_NAME || 'EventFlow';
  const resetUrl = buildClientUrl(`/reset-password/${rawToken}`);
  await sendEmail({
    to: user.email,
    subject: `Reset your password - ${appName}`,
    html: passwordResetEmailTemplate({ appName, resetUrl }),
  });
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = normalizeRole(req.body?.role);

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!email) return res.status(400).json({ message: 'Valid email is required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      message: 'Registration successful. You can now log in.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email) return res.status(400).json({ message: 'Valid email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ message: 'Valid email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If the account exists, a reset email has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = sha256(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({ user, rawToken });
    } catch (emailErr) {
      console.error('Forgot password email failed:', emailErr);
    }

    res.json({ message: 'If the account exists, a reset email has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const rawToken = String(req.params.token || '').trim();
    const cleanToken = rawToken.replace(/[^a-f0-9]/gi, '');
    const newPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!cleanToken) return res.status(400).json({ message: 'Invalid reset token' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = sha256(cleanToken);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({
      message: 'Password reset successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};