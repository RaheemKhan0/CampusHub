import mongoose, { Types } from 'mongoose';

import { connectDB } from '../../lib/connectMongodb';
import { ServerModel } from '../schemas/server.schema';
import { Degree } from '../schemas/degree.schema';
import { Module } from '../schemas/module.schema';
import { DegreeModule } from '../schemas/degree-module.schema';
import {
  seedServers,
  DEFAULT_DEGREE_SLUG,
  type SeedServer,
} from './seed-server-var';

type LeanIdOnly<T extends string> = { [K in T]: Types.ObjectId };

async function resolveDegreeContext(seed: SeedServer): Promise<{
  degreeId: Types.ObjectId;
  degreeModuleId: Types.ObjectId;
} | null> {
  if (seed.type !== 'unimodules') {
    return null;
  }

  const degreeSlug = seed.degreeSlug ?? DEFAULT_DEGREE_SLUG;
  const degree = await Degree.findOne({ slug: degreeSlug })
    .select('_id')
    .lean<LeanIdOnly<'_id'> | null>();

  if (!degree) {
    console.warn(
      `Skipping server "${seed.name}" - degree "${degreeSlug}" not found.`,
    );
    return null;
  }

  const moduleTitle = (seed.moduleTitle ?? seed.name).trim();
  const moduleDoc = await Module.findOne({ title: moduleTitle })
    .select('_id')
    .lean<LeanIdOnly<'_id'> | null>();

  if (!moduleDoc) {
    console.warn(
      `Skipping server "${seed.name}" - module "${moduleTitle}" not found.`,
    );
    return null;
  }

  const degreeModule = await DegreeModule.findOne({
    degreeId: degree._id,
    moduleId: moduleDoc._id,
  })
    .select('_id')
    .lean<LeanIdOnly<'_id'> | null>();

  if (!degreeModule) {
    console.warn(
      `Skipping server "${seed.name}" - degree module link missing for "${moduleTitle}".`,
    );
    return null;
  }

  return { degreeId: degree._id, degreeModuleId: degreeModule._id };
}

async function seedServerCollection() {
  await connectDB();

  const serverSet = new Set();

  const upserts = 0;
  const modified = 0;
  let skipped = 0;

  for (const seed of seedServers) {
    const context = await resolveDegreeContext(seed);
    console.log('degree context : ', context);
    if (seed.type === 'unimodules' && !context) {
      skipped += 1;
      continue;
    }
    console.log('seed : ', seed);
    if (!context?.degreeId || !context?.degreeModuleId) {
      skipped += 1;
      continue;
    }
    if (serverSet.has(context.degreeModuleId)) {
      console.log('duplicate degreeModuleId : ', context.degreeModuleId);
      continue;
    }
    serverSet.add(context.degreeModuleId);

    await ServerModel.updateOne(
      { slug: seed.slug },
      {
        $setOnInsert: { createdAt: new Date() },
        $set: {
          name: seed.name,
          slug: seed.slug,
          type: seed.type,
          icon: seed.icon ?? undefined,
          updatedAt: new Date(),
          degreeId: context.degreeId,
          degreeModuleId: context.degreeModuleId,
        },
      },
      { upsert: true },
    );
    console.log(
      `Seed complete: ${upserts} inserted, ${modified} updated, ${skipped} skipped.`,
    );
  }
}

async function main() {
  try {
    await seedServerCollection();
  } catch (error) {
    console.error('Seed failed:', (error as Error).message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

void main();
