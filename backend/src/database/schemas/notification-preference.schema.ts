import mongoose, { type Document, type Model, Schema, Types } from 'mongoose';

export const NotificationPreferenceLevels = [
  'all',
  'mentions',
  'none',
] as const;
export type NotificationPreferenceLevel =
  (typeof NotificationPreferenceLevels)[number];

export const DEFAULT_NOTIFICATION_PREFERENCE_LEVEL: NotificationPreferenceLevel =
  'all';

export interface INotificationPreference extends Document {
  userId: string; // Better Auth user id
  channelId: Types.ObjectId;
  level: NotificationPreferenceLevel;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: String, required: true, index: true },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: NotificationPreferenceLevels as unknown as string[],
      default: DEFAULT_NOTIFICATION_PREFERENCE_LEVEL,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'notification_preferences',
  },
);

NotificationPreferenceSchema.index(
  { channelId: 1, userId: 1 },
  { unique: true },
);

const existingModel = mongoose.models.NotificationPreference as
  | Model<INotificationPreference>
  | undefined;
export const NotificationPreference: Model<INotificationPreference> =
  existingModel ??
  mongoose.model<INotificationPreference>(
    'NotificationPreference',
    NotificationPreferenceSchema,
  );
