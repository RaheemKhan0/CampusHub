// channels.schema.ts
import { type Model, Schema, Types, Document, model, models } from 'mongoose';
import { ChannelType, ChannelTypes } from 'src/database/types';

export interface IChannel extends Document {
  serverId: Types.ObjectId;
  name: string;
  type: ChannelType;
  position: number; // ordering within the server
  privacy: 'public' | 'hidden';
  createdAt?: Date;
  updatedAt?: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    serverId: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ChannelTypes,
      required: true,
      default: 'text',
    },
    position: { type: Number, default: 0 },
    privacy: {
      type: String,
      enum: ['public', 'hidden'],
      default: 'public',
      required: true,
    },
  },
  { timestamps: true, versionKey: false, collection: 'channels' },
);

ChannelSchema.index({ serverId: 1, position: 1 });
ChannelSchema.index({ serverId: 1, name: 1 }, { unique: true }); // optional uniqueness per server

const existingChannelModel = models.Channel as Model<IChannel> | undefined;
export const Channel: Model<IChannel> =
  existingChannelModel ?? model<IChannel>('Channel', ChannelSchema);
