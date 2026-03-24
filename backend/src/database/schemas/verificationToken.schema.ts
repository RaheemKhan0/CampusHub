import mongoose, { Schema, Types, Document } from 'mongoose';

type TokenType = 'email-verify' | 'password-reset' | 'magic-link' | 'email-otp';

export interface IVerificationToken extends Document {
  userId: Types.ObjectId;
  token: string; // random; may store hashed if desired
  type: TokenType;
  expiresAt: Date; // TTL index
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const VerificationToken = mongoose.model<IVerificationToken>(
  'VerificationToken',
  VerificationTokenSchema,
);
