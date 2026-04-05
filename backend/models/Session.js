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
