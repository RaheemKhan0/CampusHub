// channels.service.ts
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Channel, IChannel } from 'src/database/schemas/channel.schema';
import { ServerModel, IServer } from 'src/database/schemas/server.schema';
import { ChannelAccess, IChannelAccess } from 'src/database/schemas/channel-access.schema';
import { Membership, IMembership } from 'src/database/schemas/membership.schema';
import { AppUser, IUser } from 'src/database/schemas/user.schema';
import { Degree, IDegree } from 'src/database/schemas/degree.schema';
import { NotificationService } from '../notifications/notification.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelViewDto } from './dto/channel-view.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHANNEL_INVITE_TTL_MS = 30 * DAY_MS;

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(private readonly notifications: NotificationService) {}

  async create(
    serverId: string,
    dto: CreateChannelDto,
    creatorId: string,
  ): Promise<ChannelViewDto> {
    let channel;
    try {
      channel = await Channel.create({
        serverId,
        name: dto.name,
        type: dto.type,
        privacy: dto.privacy,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          `A channel named "${dto.name}" already exists in this server`,
        );
      }
      throw err;
    }

    const channelObject = channel.toObject() as IChannel;

    if (dto.privacy === 'hidden') {
      // Always include the creator; merge in any extra memberIds
      const memberSet = new Set([creatorId, ...(dto.memberIds ?? [])]);
      const docs = Array.from(memberSet).map((userId) => ({
        channelId: channelObject._id,
        userId,
      }));
      await ChannelAccess.bulkWrite(
        docs.map((doc) => ({
          updateOne: {
            filter: { channelId: doc.channelId, userId: doc.userId },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
      );

      // Notify every invitee except the creator
      const invitees = Array.from(memberSet).filter((id) => id !== creatorId);
      if (invitees.length) {
        await this.deliverChannelInviteNotifications({
          serverId,
          channelId: String(channelObject._id),
          channelName: channelObject.name,
          actorId: creatorId,
          userIds: invitees,
        });
      }
    }

    return this.toChannelView(channelObject);
  }

  async findChannel(channelId: string): Promise<ChannelViewDto> {
    const channel = await Channel.findById(channelId).lean<IChannel>().exec();
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.toChannelView(channel);
  }

  async addMember(channelId: string, userId: string, addedBy?: string) {
    const result = await ChannelAccess.updateOne(
      { channelId, userId },
      { $setOnInsert: { channelId, userId, addedBy } },
      { upsert: true },
    );

    // Only notify when a new record was inserted — avoid duplicate invites on repeat calls.
    const inserted = (result as { upsertedCount?: number }).upsertedCount ?? 0;
    if (inserted > 0 && userId !== addedBy) {
      const channel = await Channel.findById(channelId)
        .select('_id name serverId')
        .lean<Pick<IChannel, '_id' | 'name' | 'serverId'> | null>();
      if (channel) {
        await this.deliverChannelInviteNotifications({
          serverId: String(channel.serverId),
          channelId: String(channel._id),
          channelName: channel.name,
          actorId: addedBy,
          userIds: [userId],
        });
      }
    }

    return { ok: true } as const;
  }

  private async deliverChannelInviteNotifications(args: {
    serverId: string;
    channelId: string;
    channelName: string;
    actorId?: string;
    userIds: string[];
  }): Promise<void> {
    if (!args.userIds.length) return;

    const server = await ServerModel.findById(args.serverId)
      .select('name')
      .lean<Pick<IServer, 'name'> | null>();
    const serverName = server?.name;

    const title = serverName
      ? `You were added to #${args.channelName} in ${serverName}`
      : `You were added to #${args.channelName}`;

    const expiresAt = new Date(
      Date.now() + CHANNEL_INVITE_TTL_MS,
    ).toISOString();

    const dtos = args.userIds.map((userId) => ({
      userId,
      actorId: args.actorId,
      channelId: args.channelId,
      serverId: args.serverId,
      serverName,
      type: 'channel.invite' as const,
      title,
      data: { channelName: args.channelName },
      dedupeKey: `channel.invite:${userId}:${args.channelId}`,
      expiresAt,
    }));

    try {
      await this.notifications.createNotifications(dtos);
    } catch (err) {
      this.logger.warn(
        `Failed to create channel invite notifications for channel ${args.channelId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async removeMember(channelId: string, userId: string) {
    await ChannelAccess.deleteOne({ channelId, userId });
    return { ok: true } as const;
  }

  async deleteChannel(channelId: string): Promise<{ ok: true }> {
    const channel = await Channel.findByIdAndDelete(channelId).lean<IChannel | null>();
    if (!channel) throw new NotFoundException('Channel not found');
    await ChannelAccess.deleteMany({ channelId });
    return { ok: true };
  }

  private toChannelView(doc: IChannel): ChannelViewDto {
    const toIso = (value: Date | string | undefined): string =>
      new Date(value ?? Date.now()).toISOString();

    return {
      id: String(doc._id),
      serverId: String(doc.serverId),
      name: doc.name,
      type: doc.type,
      position: doc.position ?? 0,
      privacy: doc.privacy,
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    };
  }

  /**
   * Resolves the set of user IDs who should receive notifications for activity
   * in a channel. Mirrors the rules in ChannelAccessGuard but returns the
   * full recipient list instead of authorising a single caller.
   *
   * - unimodules public: everyone whose degree matches the server's degree
   * - unimodules hidden: degree match AND has an explicit ChannelAccess entry
   * - citysocieties (public or hidden): active members of the server
   *   (public channels are browseable by non-members but only members opt in
   *   to notifications)
   * - other server types public: active members of the server
   * - other server types hidden: active members who are owner/admin OR have
   *   an explicit ChannelAccess entry
   */
  async getAccessibleUserIds(channelId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(channelId)) {
      throw new NotFoundException('Channel not found');
    }

    const channel = await Channel.findById(channelId)
      .select('_id serverId privacy')
      .lean<Pick<IChannel, '_id' | 'serverId' | 'privacy'> | null>();
    if (!channel) throw new NotFoundException('Channel not found');

    const server = await ServerModel.findById(channel.serverId)
      .select('type degreeId')
      .lean<Pick<IServer, 'type' | 'degreeId'> | null>();
    if (!server) throw new NotFoundException('Server not found');

    if (server.type === 'unimodules') {
      if (!server.degreeId) return [];

      const degree = await Degree.findById(server.degreeId)
        .select('slug')
        .lean<Pick<IDegree, 'slug'> | null>();
      if (!degree) return [];

      const usersInDegree = await AppUser.find({ degreeSlug: degree.slug })
        .select('userId')
        .lean<Pick<IUser, 'userId'>[]>();
      const degreeUserIds = usersInDegree.map((u) => u.userId);

      if (channel.privacy === 'public') {
        return degreeUserIds;
      }

      const access = await ChannelAccess.find({ channelId: channel._id })
        .select('userId')
        .lean<Pick<IChannelAccess, 'userId'>[]>();
      const accessSet = new Set(access.map((a) => a.userId));
      return degreeUserIds.filter((id) => accessSet.has(id));
    }

    // For citysocieties and all other server types, recipients must be
    // active members of the server.
    const memberships = await Membership.find({
      serverId: channel.serverId,
      status: 'active',
    })
      .select('userId roles')
      .lean<Pick<IMembership, 'userId' | 'roles'>[]>();

    if (!memberships.length) return [];

    if (channel.privacy === 'public') {
      return memberships.map((m) => m.userId);
    }

    if (server.type === 'citysocieties') {
      // Hidden society channels don't use ChannelAccess — any active member.
      return memberships.map((m) => m.userId);
    }

    // Other server types with a hidden channel: owners/admins always qualify,
    // other members need an explicit ChannelAccess entry.
    const access = await ChannelAccess.find({ channelId: channel._id })
      .select('userId')
      .lean<Pick<IChannelAccess, 'userId'>[]>();
    const accessSet = new Set(access.map((a) => a.userId));

    return memberships
      .filter((m) => {
        const isAdmin =
          m.roles.includes('owner') || m.roles.includes('admin');
        return isAdmin || accessSet.has(m.userId);
      })
      .map((m) => m.userId);
  }

  async list(userId: string, serverId: string) {
    const sId = new Types.ObjectId(serverId);

    const server = await ServerModel.findById(sId)
      .select('type')
      .lean<{ type: string } | null>();

    const publicDocs = await Channel.find({ serverId: sId, privacy: 'public' })
      .sort({ position: 1, createdAt: -1 })
      .lean<IChannel[]>()
      .exec();

    let privateDocs: IChannel[];

    if (server?.type === 'citysocieties') {
      // Return all hidden channels so non-members can see them (but not access them)
      privateDocs = await Channel.find({ serverId: sId, privacy: 'hidden' })
        .sort({ position: 1, createdAt: -1 })
        .lean<IChannel[]>()
        .exec();
    } else {
      // Only return hidden channels the user has explicit access to
      const accessDocs = await ChannelAccess.find({ userId })
        .select('channelId')
        .lean<Pick<IChannelAccess, 'channelId'>[]>()
        .exec();

      const channelIds = accessDocs.map((doc) => doc.channelId);
      privateDocs = channelIds.length
        ? await Channel.find({
            _id: { $in: channelIds },
            serverId: sId,
            privacy: 'hidden',
          })
            .sort({ position: 1, createdAt: -1 })
            .lean<IChannel[]>()
            .exec()
        : [];
    }

    const publicChannels = publicDocs.map((doc) => this.toChannelView(doc));
    const privateChannels = privateDocs.map((doc) => this.toChannelView(doc));

    return {
      publicChannels,
      privateChannels,
      total: publicChannels.length + privateChannels.length,
      page: 1,
      pageSize: publicChannels.length + privateChannels.length,
    };
  }
}
