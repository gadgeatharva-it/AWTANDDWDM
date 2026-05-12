const User = require('../models/User');

// GET /api/users — list users (admin/organiser)
exports.listUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20, active } = req.query;

    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (role) filter.role = role;
    if (typeof active !== 'undefined') {
      const normalized = String(active).toLowerCase();
      if (normalized === 'true') filter.isActive = true;
      if (normalized === 'false') filter.isActive = false;
    }
    if (search) {
      const q = String(search).trim();
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ];
      }
    }

    // Organisers can't view admin accounts.
    if (req.user.role !== 'admin') filter.role = filter.role || { $ne: 'admin' };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role isActive createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: safePage, pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/active — activate/deactivate (admin only)
exports.setUserActive = async (req, res, next) => {
  try {
    const { active } = req.body;
    const nextActive = typeof active === 'boolean' ? active : String(active).toLowerCase() === 'true';

    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admin accounts cannot be changed' });

    user.isActive = nextActive;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};

