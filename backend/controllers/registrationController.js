const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const {
  sendEventRegistrationConfirmationEmail,
  sendEventRegistrationNotificationEmail,
} = require('../services/emailService');

async function sendRegistrationEmails({ event, attendeeId }) {
  try {
    const attendee = await User.findById(attendeeId).select('name email').lean();
    const organiser = event.organiser;

    if (!attendee) return;

    await Promise.all([
      sendEventRegistrationConfirmationEmail({ attendee, event }),
      organiser?.email
        ? sendEventRegistrationNotificationEmail({
            organiser,
            attendee,
            event,
          })
        : Promise.resolve(),
    ]);

    console.log(`[registrations] Sent registration emails for "${event.title}"`);
  } catch (emailErr) {
    console.error('[registrations] Registration email failed:', emailErr?.message || emailErr);
  }
}

// POST /api/registrations/register
exports.registerForEvent = async (req, res, next) => {
  try {
    const { eventId, notes } = req.body;

    const event = await Event.findById(eventId).populate('organiser', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'published') return res.status(400).json({ message: 'Event is not open for registration' });
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    const existing = await Registration.findOne({ event: eventId, attendee: req.user.id });
    if (existing && existing.status === 'confirmed') {
      return res.status(409).json({ message: 'Already registered for this event' });
    }

    let registration;
    if (existing) {
      existing.status = 'confirmed';
      existing.notes = notes || existing.notes;
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        event: eventId,
        attendee: req.user.id,
        notes,
        status: 'confirmed',
      });
    }

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
    await sendRegistrationEmails({ event, attendeeId: req.user.id });

    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Registration.findOne({ event: req.body.eventId, attendee: req.user.id });
      if (existing && existing.status !== 'confirmed') {
        existing.status = 'confirmed';
        if (req.body.notes) existing.notes = req.body.notes;
        const registration = await existing.save();
        await Event.findByIdAndUpdate(req.body.eventId, { $inc: { registeredCount: 1 } });
        const event = await Event.findById(req.body.eventId).populate('organiser', 'name email');
        if (event) await sendRegistrationEmails({ event, attendeeId: req.user.id });
        return res.status(201).json(registration);
      }
      return res.status(409).json({ message: 'Already registered for this event' });
    }
    next(err);
  }
};

// DELETE /api/registrations/cancel/:eventId
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.eventId,
      attendee: req.user.id,
    });

    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

    registration.status = 'cancelled';
    await registration.save();

    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { registeredCount: -1 } });

    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/my
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ attendee: req.user.id, status: 'confirmed' })
      .populate('event', 'title startDate endDate location city category status externalUrl updatedAt')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/event/:eventId — attendees for an event
exports.getEventAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organiser.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const registrations = await Registration.find({ event: req.params.eventId, status: 'confirmed' })
      .populate('attendee', 'name email')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/activity — activity feed for organisers/admins
exports.getRegistrationActivity = async (req, res, next) => {
  try {
    if (req.user.role === 'attendee') return res.status(403).json({ message: 'Not authorised' });

    const { page = 1, limit = 20, eventId, attendeeId } = req.query;
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const registrationFilter = {};
    if (eventId) {
      const eventFilter = { _id: eventId };
      if (req.user.role !== 'admin') eventFilter.organiser = req.user.id;
      const event = await Event.findOne(eventFilter).select('_id').lean();
      if (!event) return res.json({ logs: [], total: 0, page: safePage, pages: 0 });
      registrationFilter.event = event._id;
    } else if (req.user.role !== 'admin') {
      const eventIds = await Event.find({ organiser: req.user.id }).select('_id').lean();
      const ids = eventIds.map((row) => row._id);
      if (ids.length === 0) return res.json({ logs: [], total: 0, page: safePage, pages: 0 });
      registrationFilter.event = { $in: ids };
    }

    if (attendeeId) registrationFilter.attendee = attendeeId;

    const [logs, total] = await Promise.all([
      Registration.find(registrationFilter)
        .populate('event', 'title organiser')
        .populate('attendee', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .maxTimeMS(8000)
        .lean(),
      Registration.countDocuments(registrationFilter).maxTimeMS(8000),
    ]);

    res.json({
      logs: logs.map((row) => ({
        _id: row._id,
        status: row.status,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        activityAt: row.status === 'cancelled' ? row.updatedAt : row.createdAt,
        type: row.status === 'cancelled' ? 'registration_cancelled' : 'registration_confirmed',
        attendee: row.attendee,
        event: row.event,
      })),
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/my-attendees — attendee list scoped to organiser-owned events
exports.getMyAttendees = async (req, res, next) => {
  try {
    if (req.user.role !== 'organiser') return res.status(403).json({ message: 'Not authorised' });

    const { page = 1, limit = 20, search } = req.query;
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const eventIds = await Event.find({ organiser: req.user.id }).select('_id').lean();
    const ids = eventIds.map((row) => row._id);
    if (ids.length === 0) return res.json({ attendees: [], total: 0, page: safePage, pages: 0 });

    const pipeline = [
      { $match: { event: { $in: ids }, status: 'confirmed' } },
      {
        $lookup: {
          from: 'users',
          localField: 'attendee',
          foreignField: '_id',
          as: 'attendee',
        },
      },
      { $unwind: '$attendee' },
    ];

    const q = String(search || '').trim();
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({
        $match: {
          $or: [
            { 'attendee.name': { $regex: escaped, $options: 'i' } },
            { 'attendee.email': { $regex: escaped, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$attendee._id',
          name: { $first: '$attendee.name' },
          email: { $first: '$attendee.email' },
          registrations: { $sum: 1 },
          lastRegisteredAt: { $max: '$createdAt' },
        },
      },
      { $sort: { lastRegisteredAt: -1 } },
      {
        $facet: {
          attendees: [{ $skip: skip }, { $limit: safeLimit }],
          meta: [{ $count: 'total' }],
        },
      }
    );

    const [result] = await Registration.aggregate(pipeline).option({ maxTimeMS: 8000 });
    const attendees = result?.attendees || [];
    const total = result?.meta?.[0]?.total || 0;

    res.json({ attendees, total, page: safePage, pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    next(err);
  }
};
