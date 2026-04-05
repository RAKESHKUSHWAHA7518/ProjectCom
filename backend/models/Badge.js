import mongoose from 'mongoose';

const badgeSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'top_mentor',
        'quick_learner',
        'first_session',
        'five_sessions',
        'ten_sessions',
        'streak_7',
        'streak_30',
        'highly_rated',
        'community_helper',
        'skill_master',
      ],
    },
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '🏆',
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

badgeSchema.index({ user: 1, type: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
