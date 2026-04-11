import { Injectable, Logger } from '@nestjs/common';

type SocketSubscription = {
  userId: string;
  channels: Set<string>;
};

/**
 * Tracks which users are currently joined to a channel's socket room.
 *
 * A single user may hold multiple sockets (e.g. several tabs) — we refcount
 * presence per (channelId, userId) so a user only leaves presence once all of
 * their sockets have disconnected or left the room.
 *
 * This is an in-memory, per-process store. It is accurate for a single Nest
 * instance; multi-instance deployments would need a shared adapter (Redis).
 */
@Injectable()
export class ChannelPresenceService {
  private readonly logger = new Logger(ChannelPresenceService.name);

  private readonly socketSubscriptions = new Map<string, SocketSubscription>();
  private readonly channelUserCounts = new Map<string, Map<string, number>>();

  join(socketId: string, userId: string, channelId: string): void {
    if (!socketId || !userId || !channelId) return;

    let sub = this.socketSubscriptions.get(socketId);
    if (!sub) {
      sub = { userId, channels: new Set() };
      this.socketSubscriptions.set(socketId, sub);
    }

    if (sub.channels.has(channelId)) return;
    sub.channels.add(channelId);
    this.incrementCount(channelId, userId);
  }

  leave(socketId: string, channelId: string): void {
    if (!socketId || !channelId) return;
    const sub = this.socketSubscriptions.get(socketId);
    if (!sub || !sub.channels.has(channelId)) return;

    sub.channels.delete(channelId);
    this.decrementCount(channelId, sub.userId);

    if (sub.channels.size === 0) {
      this.socketSubscriptions.delete(socketId);
    }
  }

  disconnect(socketId: string): void {
    if (!socketId) return;
    const sub = this.socketSubscriptions.get(socketId);
    if (!sub) return;

    for (const channelId of sub.channels) {
      this.decrementCount(channelId, sub.userId);
    }
    this.socketSubscriptions.delete(socketId);
  }

  isPresent(channelId: string, userId: string): boolean {
    const users = this.channelUserCounts.get(channelId);
    if (!users) return false;
    return (users.get(userId) ?? 0) > 0;
  }

  private incrementCount(channelId: string, userId: string): void {
    let users = this.channelUserCounts.get(channelId);
    if (!users) {
      users = new Map();
      this.channelUserCounts.set(channelId, users);
    }
    users.set(userId, (users.get(userId) ?? 0) + 1);
  }

  private decrementCount(channelId: string, userId: string): void {
    const users = this.channelUserCounts.get(channelId);
    if (!users) return;
    const next = (users.get(userId) ?? 0) - 1;
    if (next <= 0) {
      users.delete(userId);
    } else {
      users.set(userId, next);
    }
    if (users.size === 0) {
      this.channelUserCounts.delete(channelId);
    }
  }
}
