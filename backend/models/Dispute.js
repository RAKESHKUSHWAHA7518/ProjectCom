import mongoose from 'mongoose';

const disputeSchema = mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
      enum: ['no_show', 'poor_quality', 'misrepresentation', 'payment_issue', 'behavior', 'other'],
    },
    details: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolution: {
      type: String,
      enum: ['refund_learner', 'refund_mentor', 'partial_refund', 'warning', 'no_action'],
      default: null,
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
    adminNotes: {
      type: String,
      default: '',
    },
    evidence: [{
      type: String, // URLs to screenshots, chat logs, etc.
    }],
  },
  {
    timestamps: true,
  }
);

disputeSchema.index({ session: 1 });
disputeSchema.index({ raisedBy: 1 });
disputeSchema.index({ againstUser: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;