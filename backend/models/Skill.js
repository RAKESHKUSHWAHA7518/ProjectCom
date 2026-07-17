import mongoose from 'mongoose';

const skillSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['teach', 'learn'],
    },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    endorsements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
  },
  {
    timestamps: true,
  }
);

skillSchema.index({ user: 1, type: 1 });
skillSchema.index({ name: 'text', category: 'text' });

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
