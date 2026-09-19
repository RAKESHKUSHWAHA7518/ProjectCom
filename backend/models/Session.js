import mongoose from 'mongoose';

const sessionSchema = mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Skill',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 45, // duration in minutes
    },
    template: {
      type: String,
      default: 'standard',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: {
      type: String,
      default: '',
    },
    recurrenceEnd: {
      type: Date,
    },
    recurrenceId: {
      type: String, // UUID to group all sessions in a recurring series
      index: true,
    },
    parentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    meetingLink: {
      type: String, // WebRTC room ID or external link
    },
    notes: {
      type: String,
    },
    sharedNotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: String,
        resources: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    creditsExchanged: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ mentor: 1 });
sessionSchema.index({ learner: 1 });
sessionSchema.index({ scheduledAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
