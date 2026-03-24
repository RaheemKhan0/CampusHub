import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import mongoose from 'mongoose';
import { connectDB } from '../../lib/connectMongodb';
import { Degree, IDegree } from '../schemas/degree.schema';
import { IModule, Module } from '../schemas/module.schema';
import { DegreeModule } from '../schemas/degree-module.schema';

type ModuleSeed = {
  year: string;
  code: string | null;
  name: string;
  moduleKind: 'core' | 'elective';
  term: 'firstterm' | 'secondterm' | 'full-year';
};

type DegreeSeed = {
  degree_title: string;
  durationYears: number;
  modules: ModuleSeed[];
};

const DATA_PATH = path.resolve(__dirname, 'degree.json');

function parseYear(year: string): number {
  const match = year.match(/\d+/);
  if (!match) throw new Error(`Invalid year label: ${year}`);
  return Number(match[0]);
}

async function main() {
  if (mongoose.models.Degree) {
    console.log('deleting old degree model');
    delete mongoose.models.Degree;
  }
  await connectDB();

  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const payload = JSON.parse(raw) as { degrees: DegreeSeed[] };
  console.log('payload : ', payload);

  for (const entry of payload.degrees) {
    const slug = slugify(entry.degree_title, { lower: true, strict: true });
    console.log('slug : ', slug);

    const degree = await Degree.findOneAndUpdate(
      { slug: slug },
      {
        $setOnInsert: { createdAt: new Date() },
        $set: {
          name: entry.degree_title,
          type: 'undergraduate',
          durationYears: entry.durationYears,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean<IDegree>();

    for (const moduleSeed of entry.modules) {
      const year = parseYear(moduleSeed.year);
      const moduleSlug = slugify(moduleSeed.name, {
        lower: true,
        strict: true,
      });

      const moduleDoc = await Module.findOneAndUpdate(
        { slug: moduleSlug },
        {
          $setOnInsert: {
            createdAt: new Date(),
          },
          $set: {
            title: moduleSeed.name,
            moduleKind: moduleSeed.moduleKind,
            term: moduleSeed.term,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      ).lean<IModule>();

      console.log('degree : ', degree);
      console.log('module Doc : ', moduleDoc);

      if (!degree || !moduleDoc) {
        throw Error(`module and degree not defined`);
      }
      await DegreeModule.updateOne(
        { degreeId: degree._id, moduleId: moduleDoc._id },
        {
          $setOnInsert: {
            degreeId: degree._id,
            moduleId: moduleDoc._id,
            createdAt: new Date(),
          },
          $set: {
            year,
            kind: moduleSeed.moduleKind,
            term: moduleSeed.term,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
}

main()
  .then(async () => mongoose.connection.close())
  .catch((err) => {
    console.error('Degree seed failed:', err);
    void mongoose.connection.close().finally(() => process.exit(1));
  });
