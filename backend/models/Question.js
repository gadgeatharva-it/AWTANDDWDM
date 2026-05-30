const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [800, 'Question cannot exceed 800 characters'],
    },
    answer: {
      type: String,
      trim: true,
      maxlength: [2000, 'Answer cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'answered'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
);

questionSchema.index({ event: 1, attendee: 1, createdAt: -1 });
questionSchema.index({ organiser: 1, status: 1, createdAt: -1 });
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
