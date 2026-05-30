// const mongoose = require('mongoose');

// const eventSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, 'Event title is required'],
//       trim: true,
//       maxlength: [120, 'Title cannot exceed 120 characters'],
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: [1000, 'Description cannot exceed 1000 characters'],
//       default: '',
//     },
//     category: {
//       type: String,
//       enum: ['conference', 'workshop', 'webinar', 'meetup', 'concert', 'sports', 'other'],
//       default: 'other',
//     },
//     status: {
//       type: String,
//       enum: ['draft', 'published', 'cancelled', 'completed'],
//       default: 'draft',
//     },
//     location: {
//       type: String,
//       trim: true,
//       default: 'Online',
//     },
//     startDate: {
//       type: Date,
//       required: [true, 'Start date is required'],
//     },
//     endDate: {
//       type: Date,
//       required: [true, 'End date is required'],
//     },
//     capacity: {
//       type: Number,
//       required: [true, 'Capacity is required'],
//       min: [1, 'Capacity must be at least 1'],
//     },
//     registeredCount: {
//       type: Number,
//       default: 0,
//     },
//     price: {
//       type: Number,
//       default: 0,
//       min: [0, 'Price cannot be negative'],
//     },
//     tags: [{ type: String, trim: true }],
//     // organiser ref — indexed for fast per-user queries
//     organiser: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//   },
//   { timestamps: true }
// );

// // Indexed queries
// eventSchema.index({ organiser: 1, status: 1 });
// eventSchema.index({ category: 1 });
// eventSchema.index({ startDate: 1 });
// eventSchema.index({ title: 'text', description: 'text' });

// module.exports = mongoose.model('Event', eventSchema);



const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    // NEW → AI-generated summary
    aiSummary: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      enum: [
        'conference',
        'workshop',
        'webinar',
        'meetup',
        'concert',
        'sports',
        'other',
      ],
      default: 'other',
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },

    location: {
      type: String,
      trim: true,
      default: 'Online',
    },

    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },

    // NEW → city for AI filtering
    city: {
      type: String,
      trim: true,
      default: '',
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },

    registeredCount: {
      type: Number,
      default: 0,
    },

    // NEW → remaining tickets
    availableTickets: {
      type: Number,
      default: function () {
        return this.capacity;
      },
    },

    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },

    // NEW → total generated revenue
    revenue: {
      type: Number,
      default: 0,
    },

    tags: [{ type: String, trim: true }],

    // NEW → event agenda for AI summarization
    agenda: [
      {
        type: String,
      },
    ],

    // NEW → event banner/image
    bannerImage: {
      type: String,
      default: '',
    },

    // NEW → AI attendance prediction
    attendancePrediction: {
      type: Number,
      default: 0,
    },

    // NEW → low attendance risk
    lowAttendanceRisk: {
      type: Boolean,
      default: false,
    },

    // NEW → AI popularity score
    popularityScore: {
      type: Number,
      default: 0,
    },

    // NEW → semantic/vector search support
    embedding: {
      type: [Number],
      default: [],
    },

    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

//
// INDEXES
//

eventSchema.index({ organiser: 1, status: 1 });

eventSchema.index({ category: 1 });

eventSchema.index({ startDate: 1 });

eventSchema.index({ city: 1 });

eventSchema.index({ status: 1, category: 1, startDate: 1 });

eventSchema.index({ createdAt: -1 });

eventSchema.index({ registeredCount: -1 });

eventSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  city: 'text',
  tags: 'text',
});

module.exports = mongoose.model('Event', eventSchema);
