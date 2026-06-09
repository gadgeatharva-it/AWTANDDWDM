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
      enum: ['pending_payment', 'confirmed', 'cancelled', 'waitlisted'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'created', 'paid', 'failed', 'refunded'],
      default: 'not_required',
      index: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      select: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    reminderLastError: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// One registration per attendee per event
registrationSchema.index({ event: 1, attendee: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1, updatedAt: -1 });
registrationSchema.index({ attendee: 1, status: 1, createdAt: -1 });
registrationSchema.index({ status: 1, createdAt: -1 });
registrationSchema.index({ status: 1, reminderSent: 1, event: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
