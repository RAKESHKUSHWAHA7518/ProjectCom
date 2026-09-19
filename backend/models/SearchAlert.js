import mongoose from 'mongoose';

const searchAlertSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    query: {
      type: String,
      required: true,
      maxlength: 200,
    },
    filters: {
      category: { type: String, default: '' },
      priceRange: { type: String, default: '' }, // e.g., '0-50', '50-100'
      sessionLength: { type: String, default: '' }, // e.g., '30', '60', '90'
      language: { type: String, default: '' },
      instantBook: { type: Boolean, default: false },
      verifiedOnly: { type: Boolean, default: false },
    },
    frequency: {
      type: String,
      enum: ['instant', 'daily', 'weekly'],
      default: 'daily',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

searchAlertSchema.index({ user: 1, isActive: 1 });
searchAlertSchema.index({ isActive: 1, frequency: 1, lastSentAt: 1 });

const SearchAlert = mongoose.model('SearchAlert', searchAlertSchema);

export default SearchAlert;