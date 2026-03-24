import mongoose from 'mongoose';

import { connectDB } from '../../lib/connectMongodb';
import { ServerModel } from '../schemas/server.schema';
import { Channel } from '../schemas/channel.schema';

const DEFAULT_CHANNELS = [
  { name: 'announcements', type: 'text' as const, privacy: 'public' as const },
  { name: 'general', type: 'text' as const, privacy: 'public' as const },
  { name: 'resources', type: 'text' as const, privacy: 'public' as const },
  { name: 'q-and-a', type: 'qa' as const, privacy: 'public' as const },
];

async function seedChannelsForUnimoduleServers() {
  await connectDB();

  const servers = await ServerModel.find({ type: 'unimodules' })
    .select('_id name slug')
    .lean()
    .exec();

  if (servers.length === 0) {
    console.log('No unimodule servers found. Nothing to seed.');
    return;
  }

  const bulkOperations = servers.flatMap((server) =>
    DEFAULT_CHANNELS.map((channel, index) => ({
      updateOne: {
        filter: { serverId: server._id, name: channel.name },
        update: {
          $setOnInsert: {
            serverId: server._id,
            name: channel.name,
            type: channel.type,
            privacy: channel.privacy,
            position: index,
          },
        },
        upsert: true,
      },
    })),
  );

  if (bulkOperations.length === 0) {
    console.log('No channel operations generated.');
    return;
  }

  const result = await Channel.bulkWrite(bulkOperations, { ordered: false });

  const inserted = result.upsertedCount ?? 0;
  const modified = result.modifiedCount ?? 0;

  console.log(
    `Seed complete for ${servers.length} servers. ${inserted} channels inserted, ${modified} channels updated.`,
  );
}

async function main() {
  try {
    await seedChannelsForUnimoduleServers();
  } catch (error) {
    console.error('Channel seed failed:', (error as Error).message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

void main();
