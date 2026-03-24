// channel-access.schema.ts
import { Schema, Types, Document, model, models } from 'mongoose';

export interface IChannelAccess extends Document {
  channelId: Types.ObjectId;
  userId: string; // Better Auth user id
  addedBy?: string; // who granted access (BA user id)
  createdAt?: Date;
  updatedAt?: Date;
}

const ChannelAccessSchema = new Schema<IChannelAccess>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    addedBy: { type: String },
  },
  { timestamps: true, versionKey: false, collection: 'channel_access' },
);

ChannelAccessSchema.index({ channelId: 1, userId: 1 }, { unique: true });
ChannelAccessSchema.index({ userId: 1 });

export const ChannelAccess =
  models.ChannelAccess ||
  model<IChannelAccess>('ChannelAccess', ChannelAccessSchema);
