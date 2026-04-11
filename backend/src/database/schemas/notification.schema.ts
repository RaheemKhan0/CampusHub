import mongoose, { type Document, type Model, Schema } from 'mongoose';
import {
  NotificationStatusTypes,
  NotificationTypes,
  type NotificationStatus,
  type NotificationType,
} from '../types';

export interface INotification extends Document {
  userId: string; // Better Auth user id of the recipient
  actorId?: string; // Better Auth actor id of the invoker of the notification
  serverId?: string;
  serverName?: string;
  channelId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  data: Record<string, unknown>;
  dedupeKey?: string; // optional globally-unique key to prevent duplicate inserts
  status: NotificationStatus;
  readAt?: Date;
  seenAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    actorId: { type: String },
    serverId: { type: String, index: true },
    serverName: { type: String },
    channelId: { type: String, index: true },
    type: {
      type: String,
      required: true,
      enum: NotificationTypes as unknown as string[],
    },
    title: { type: String, required: true },
    body: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String },
    status: {
      type: String,
      required: true,
      enum: NotificationStatusTypes as unknown as string[],
      default: 'unread',
      index: true,
    },
    readAt: { type: Date },
    seenAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'notifications',
  },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, sparse: true, name: 'notification_dedupe_key_unique' },
);

const existingNotificationModel = mongoose.models.Notification as
  | Model<INotification>
  | undefined;
export const Notification: Model<INotification> =
  existingNotificationModel ??
  mongoose.model<INotification>('Notification', NotificationSchema);
