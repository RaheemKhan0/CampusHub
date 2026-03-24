import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ICredentials extends Document {
  userId: Types.ObjectId; // references users._id
  passwordHash: string; // bcrypt/argon2
  passwordVersion: number; // bump to force rehash
  createdAt: Date;
}

const CredentialsSchema = new Schema<ICredentials>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    passwordVersion: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Credentials =
  mongoose.models.Credentials ||
  mongoose.model<ICredentials>('Credentials', CredentialsSchema);
