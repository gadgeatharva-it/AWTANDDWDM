const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'waitlisted'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// One registration per attendee per event
registrationSchema.index({ event: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
