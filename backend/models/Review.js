import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    skillEndorsement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews: one review per session per reviewer
reviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
