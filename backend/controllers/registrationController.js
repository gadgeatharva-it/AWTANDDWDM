const Registration = require('../models/Registration');
const Event = require('../models/Event');

// POST /api/registrations/register
exports.registerForEvent = async (req, res, next) => {
  try {
    const { eventId, notes } = req.body;

    const event = await Event.findById(eventId);
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

    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Registration.findOne({ event: req.body.eventId, attendee: req.user.id });
      if (existing && existing.status !== 'confirmed') {
        existing.status = 'confirmed';
        if (req.body.notes) existing.notes = req.body.notes;
        const registration = await existing.save();
        await Event.findByIdAndUpdate(req.body.eventId, { $inc: { registeredCount: 1 } });
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
      .populate('event', 'title startDate location category status')
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
