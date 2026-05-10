import mongoose from 'mongoose';

const postSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const communitySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '💬',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    posts: [postSchema],
  },
  {
    timestamps: true,
  }
);

const Community = mongoose.model('Community', communitySchema);

export default Community;
