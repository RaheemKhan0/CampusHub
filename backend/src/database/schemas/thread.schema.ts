import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IThread extends Document {
  channelId: Types.ObjectId; // ref: Channel (type 'qa' ideally)
  createdBy: string; // BetterAuth user id
  title: string;
  status: 'open' | 'answered';
  acceptedMessageId?: Types.ObjectId; // ref: Message (the accepted answer)
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    createdBy: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ['open', 'answered'],
      default: 'open',
      index: true,
    },
    acceptedMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true, versionKey: false, collection: 'threads' },
);

ThreadSchema.index({ channelId: 1, createdAt: 1 });

export const Thread =
  mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);
