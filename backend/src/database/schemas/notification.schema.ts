import mongoose, { type Document, type Model, Schema } from 'mongoose';
import {
  NotificationStatusTypes,
  NotificationTypes,
  type NotificationStatus,
  type NotificationType,
} from '../types';

export interface INotification extends Document {
  userId: string; // Better Auth user id of the recipient
  type: NotificationType;
  data: Record<string, unknown>;
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
    type: {
      type: String,
      required: true,
      enum: NotificationTypes as unknown as string[],
    },
    data: { type: Schema.Types.Mixed, default: {} },
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

const existingNotificationModel = mongoose.models.Notification as
  | Model<INotification>
  | undefined;
export const Notification: Model<INotification> =
  existingNotificationModel ??
  mongoose.model<INotification>('Notification', NotificationSchema);
