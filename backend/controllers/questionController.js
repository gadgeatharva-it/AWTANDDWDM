const Question = require('../models/Question');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// POST /api/questions — attendee asks organiser (must be registered)
exports.createQuestion = async (req, res, next) => {
  try {
    if (req.user.role !== 'attendee') return res.status(403).json({ message: 'Only attendees can ask questions' });

    const { eventId, question } = req.body;
    if (!eventId || !question || !String(question).trim()) {
      return res.status(400).json({ message: 'eventId and question are required' });
    }

    const event = await Event.findById(eventId).select('organiser title status').lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status === 'cancelled') return res.status(400).json({ message: 'Event is cancelled' });
    if (!event.organiser) return res.status(400).json({ message: 'Event has no organiser configured' });

    const organiserExists = await User.exists({ _id: event.organiser });
    if (!organiserExists) return res.status(400).json({ message: 'Event organiser account no longer exists' });

    const registration = await Registration.findOne({ event: eventId, attendee: req.user.id, status: 'confirmed' }).select('_id');
    if (!registration) return res.status(403).json({ message: 'You must be registered for this event to ask a question' });

    const created = await Question.create({
      event: eventId,
      attendee: req.user.id,
      organiser: event.organiser,
      question: String(question).trim(),
      status: 'open',
    });

    const populated = await Question.findById(created._id)
      .populate('event', 'title')
      .populate('attendee', 'name email')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// GET /api/questions/my — attendee feed
exports.getMyQuestions = async (req, res, next) => {
  try {
    if (req.user.role !== 'attendee') return res.status(403).json({ message: 'Not authorised' });
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const [questions, total] = await Promise.all([
      Question.find({ attendee: req.user.id })
        .populate('event', 'title startDate location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Question.countDocuments({ attendee: req.user.id }),
    ]);

    res.json({ questions, total, page: safePage, pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/questions/inbox — organiser/admin inbox
exports.getInbox = async (req, res, next) => {
  try {
    if (req.user.role === 'attendee') return res.status(403).json({ message: 'Not authorised' });
    const { page = 1, limit = 20, status, eventId } = req.query;
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (status) filter.status = status;
    if (eventId) filter.event = eventId;

    // Use Events as the source of truth for organiser ownership so inbox
    // still works even if `Question.organiser` is missing/incorrect.
    if (req.user.role !== 'admin') {
      const myEventIds = await Event.find({ organiser: req.user.id }).distinct('_id');
      filter.event = filter.event ? filter.event : { $in: myEventIds };
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('event', 'title organiser startDate')
        .populate('attendee', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, total, page: safePage, pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/questions/:id/answer — organiser/admin answers
exports.answerQuestion = async (req, res, next) => {
  try {
    if (req.user.role === 'attendee') return res.status(403).json({ message: 'Not authorised' });
    const { answer } = req.body;
    if (!answer || !String(answer).trim()) return res.status(400).json({ message: 'Answer is required' });

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (req.user.role !== 'admin') {
      const event = await Event.findById(question.event).select('organiser').lean();
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (!event.organiser || String(event.organiser) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not authorised' });
      }
    }

    question.answer = String(answer).trim();
    question.status = 'answered';
    await question.save();

    const populated = await Question.findById(question._id)
      .populate('event', 'title organiser startDate')
      .populate('attendee', 'name email')
      .lean();

    res.json(populated);
  } catch (err) {
    next(err);
  }
};
