import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import type { IChannel } from 'src/database/schemas/channel.schema';
import { Channel } from 'src/database/schemas/channel.schema';
import type { IMessage } from 'src/database/schemas/message.schema';
import { Messages } from 'src/database/schemas/message.schema';
import { CreateMessageDto } from './dto/message-create.dto';
import { MessageViewDto } from './dto/message-view.dto';
import { MessageListResponseDto } from './dto/message-list-response.dto';

const MAX_PAGE_SIZE = 100;

type ChannelLean = Pick<IChannel, '_id'>;

type MessageQueryParams = { page?: number; pageSize?: number };

@Injectable()
export class MessagesService {
  async createMessage(
    serverId: string,
    channelId: string,
    dto: CreateMessageDto,
    userId: string,
    authorName?: string,
  ): Promise<MessageViewDto> {
    if (!userId) throw new UnauthorizedException('Missing user context');

    if (
      !Types.ObjectId.isValid(channelId) ||
      !Types.ObjectId.isValid(serverId)
    ) {
      throw new NotFoundException('Channel not found');
    }

    const channelObjectId = new Types.ObjectId(channelId);
    const serverObjectId = new Types.ObjectId(serverId);

    const channel = await Channel.findOne({
      _id: channelObjectId,
      serverId: serverObjectId,
    })
      .select('_id')
      .lean<ChannelLean | null>();
    if (!channel) throw new NotFoundException('Channel not found');

    const resolvedAuthorName = authorName ?? dto.authorName;
    if (!resolvedAuthorName) {
      throw new UnauthorizedException('Missing author name');
    }

    const now = new Date();
    const createdMessage = await Messages.create({
      channelId: channel._id,
      authorId: userId,
      content: dto.content,
      authorName: resolvedAuthorName,
      attachments: dto.attachments ?? [],
      mentions: dto.mentions ?? [],
      createdAt: now,
      updatedAt: now,
    });

    return this.toMessageView(createdMessage);
  }

  async listMessages(
    serverId: string,
    channelId: string,
    params: MessageQueryParams,
  ): Promise<MessageListResponseDto> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, params.pageSize ?? 50),
    );

    if (
      !Types.ObjectId.isValid(channelId) ||
      !Types.ObjectId.isValid(serverId)
    ) {
      throw new NotFoundException('Channel not found');
    }

    const channelObjectId = new Types.ObjectId(channelId);
    const serverObjectId = new Types.ObjectId(serverId);

    const channel = await Channel.findOne({
      _id: channelObjectId,
      serverId: serverObjectId,
    })
      .select('_id')
      .lean<ChannelLean | null>();
    if (!channel) throw new NotFoundException('Channel not found');

    const query = Messages.find({ channelId: channel._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<IMessage[]>()
      .exec();

    const [items, total] = await Promise.all([
      query,
      Messages.countDocuments({ channelId: channel._id }),
    ]);

    const ordered = items.reverse();

    return {
      items: ordered.map((doc) => this.toMessageView(doc)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  private toMessageView(doc: IMessage): MessageViewDto {
    const toIso = (value: Date | string | undefined): string =>
      new Date(value ?? Date.now()).toISOString();

    return {
      id: String(doc._id),
      channelId: String(doc.channelId),
      authorId: doc.authorId,
      authorName: doc.authorName,
      content: doc.content,
      attachments: doc.attachments ?? [],
      mentions: doc.mentions ?? [],
      editedAt: doc.editedAt ? toIso(doc.editedAt) : undefined,
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    };
  }
}
