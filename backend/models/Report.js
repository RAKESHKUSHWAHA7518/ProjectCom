import mongoose from 'mongoose';

const reportSchema = mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'],
    },
    details: {
      type: String,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUserId: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
