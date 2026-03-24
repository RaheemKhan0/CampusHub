import mongoose, { type Model, Schema, Document, Types } from 'mongoose';

export interface IAttachment {
  url: string; // storage URL (S3/R2/etc.)
  name?: string;
  mime?: string;
  size?: number;
}

export interface IMention {
  userId: string; // BetterAuth user id
}

export interface IMessage extends Document {
  // Exactly one of these must be set (enforced in pre-validate hook)
  channelId?: Types.ObjectId; // ref: Channel
  threadId?: Types.ObjectId; // ref: Thread

  authorId: string; // BetterAuth user id
  authorName: string;
  content: string;
  attachments: IAttachment[];
  mentions: IMention[];
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String },
    mime: { type: String },
    size: { type: Number },
  },
  { _id: false, versionKey: false },
);

const MentionSchema = new Schema<IMention>(
  {
    userId: { type: String, required: true },
  },
  { _id: false, versionKey: false },
);

const MessageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    attachments: { type: [AttachmentSchema], default: [] },
    mentions: { type: [MentionSchema], default: [] },
    editedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, collection: 'messages' },
);

// Fast pagination
MessageSchema.index({ channelId: 1, createdAt: 1 });
MessageSchema.index({ threadId: 1, createdAt: 1 });
// Basic text search (upgrade to Atlas Search later)
MessageSchema.index({ content: 'text' });

// Enforce XOR: exactly one of channelId or threadId
MessageSchema.pre('validate', function (next) {
  const hasChannel = !!this.channelId;
  const hasThread = !!this.threadId;
  if (hasChannel === hasThread) {
    return next(new Error('Exactly one of channelId or threadId must be set.'));
  }
  next();
});

const existingMessageModel = mongoose.models.Message as
  | Model<IMessage>
  | undefined;
export const Messages: Model<IMessage> =
  existingMessageModel ?? mongoose.model<IMessage>('Message', MessageSchema);

const existingAttachmentModel = mongoose.models.Attachment as
  | Model<IAttachment>
  | undefined;
export const Attachment: Model<IAttachment> =
  existingAttachmentModel ??
  mongoose.model<IAttachment>('Attachment', AttachmentSchema);

const existingMentionModel = mongoose.models.Mention as
  | Model<IMention>
  | undefined;
export const Mention: Model<IMention> =
  existingMentionModel ?? mongoose.model<IMention>('Mention', MentionSchema);
