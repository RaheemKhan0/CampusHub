import mongoose, { type Model, Schema, Document, Types } from 'mongoose';
import {
  Role,
  MembershipStatus,
  MembershipStatusTypes,
  RoleTypes,
} from '../types';

export interface IMembership extends Document {
  serverId: Types.ObjectId; // ref: Server._id
  userId: string; // Better Auth user id (string)
  roles: Role[]; // MULTI-role
  status: MembershipStatus; // 'active' | 'banned' | 'left'
  joinedAt: Date; // default: now
  nickname?: string;
  invitedBy?: string; // Better Auth user id of inviter (optional)
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ----- schema -----
const MembershipSchema = new Schema<IMembership>(
  {
    serverId: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
    userId: { type: String, required: true }, // BA user id (string)
    roles: {
      type: [String],
      enum: RoleTypes as unknown as string[], // << runtime array, not a TS type
      default: ['member'],
      required: true,
    },
    status: {
      type: String,
      enum: MembershipStatusTypes as unknown as string[],
      default: 'active',
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    nickname: { type: String },
    invitedBy: { type: String },
    lastSeenAt: { type: Date },
  },
  { timestamps: true },
);

MembershipSchema.index({ serverId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ serverId: 1 });
MembershipSchema.index({ serverId: 1, status: 1 });

const existingMembershipModel = mongoose.models.Membership as
  | Model<IMembership>
  | undefined;
export const Membership: Model<IMembership> =
  existingMembershipModel ??
  mongoose.model<IMembership>('Membership', MembershipSchema);
