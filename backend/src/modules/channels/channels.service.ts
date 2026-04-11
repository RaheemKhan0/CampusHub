// channels.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Channel, IChannel } from 'src/database/schemas/channel.schema';
import { ChannelAccess, IChannelAccess } from 'src/database/schemas/channel-access.schema';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelViewDto } from './dto/channel-view.dto';

@Injectable()
export class ChannelsService {
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

  async addMember(channelId: string, userId: string) {
    await ChannelAccess.updateOne(
      { channelId, userId },
      { $setOnInsert: { channelId, userId } },
      { upsert: true },
    );
    return { ok: true } as const;
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

  async list(userId: string, serverId: string) {
    const sId = new Types.ObjectId(serverId);

    const publicDocs = await Channel.find({ serverId: sId, privacy: 'public' })
      .sort({ position: 1, createdAt: -1 })
      .lean<IChannel[]>()
      .exec();

    const accessDocs = await ChannelAccess.find({ userId })
      .select('channelId')
      .lean<Pick<IChannelAccess, 'channelId'>[]>()
      .exec();

    const channelIds = accessDocs.map((doc) => doc.channelId);
    const privateDocs = channelIds.length
      ? await Channel.find({
          _id: { $in: channelIds },
          serverId: sId,
          privacy: 'hidden',
        })
          .sort({ position: 1, createdAt: -1 })
          .lean<IChannel[]>()
          .exec()
      : [];

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
