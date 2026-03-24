// channels.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Channel, IChannel } from 'src/database/schemas/channel.schema';
import { ChannelAccess } from 'src/database/schemas/channel-access.schema';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelViewDto } from './dto/channel-view.dto';

@Injectable()
export class ChannelsService {
  async create(
    serverId: string,
    dto: CreateChannelDto,
  ): Promise<ChannelViewDto> {
    const channel = await Channel.create({
      serverId,
      name: dto.name,
      type: dto.type,
      privacy: dto.privacy,
    });

    const channelObject = channel.toObject() as IChannel;

    if (dto.privacy === 'hidden' && dto.memberIds?.length) {
      const docs = dto.memberIds.map((userId) => ({
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

  async listVisible(userId: string, serverId: string) {
    const sId = new Types.ObjectId(serverId);

    const publicDocs = await Channel.find({ serverId: sId, privacy: 'public' })
      .sort({ position: 1, createdAt: -1 })
      .lean<IChannel[]>()
      .exec();

    const accessDocs = await ChannelAccess.find({ userId })
      .select('channelId')
      .lean<IChannel[]>()
      .exec();

    const channelIds = accessDocs.map((doc) => doc._id);
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
