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

const Session = mongoose.model('Session', sessionSchema);

export default Session;
