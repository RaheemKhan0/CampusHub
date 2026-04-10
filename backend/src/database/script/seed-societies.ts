import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDB } from '../../lib/connectMongodb';
import { ServerModel } from '../schemas/server.schema';

const societies = [
  // Sports
  { name: 'City Football Club' },
  { name: 'Basketball Society' },
  { name: 'Tennis Club' },
  { name: 'Swimming & Water Polo' },
  { name: 'Badminton Society' },
  { name: 'Volleyball Club' },
  { name: 'Cycling Society' },
  { name: 'Martial Arts Society' },

  // Academic & Professional
  { name: 'Computer Science Society' },
  { name: 'Mathematics Society' },
  { name: 'Law Society' },
  { name: 'Economics & Finance Society' },
  { name: 'Engineering Society' },
  { name: 'Psychology Society' },
  { name: 'Debate Society' },
  { name: 'Model United Nations' },

  // Arts & Culture
  { name: 'Film & Media Society' },
  { name: 'Photography Society' },
  { name: 'Music Society' },
  { name: 'Drama & Theatre Society' },
  { name: 'Art & Design Society' },

  // Lifestyle & Community
  { name: 'Gaming Society' },
  { name: 'Chess Club' },
  { name: 'Cooking & Food Society' },
  { name: 'Entrepreneurship Society' },
  { name: 'Volunteering & Community Outreach' },
  { name: 'Environmental & Sustainability Society' },
  { name: 'International Students Society' },
];

async function main() {
  await connectDB();

  let inserted = 0;
  let skipped = 0;

  for (const society of societies) {
    const slug = slugify(society.name, { lower: true, strict: true });

    const existing = await ServerModel.findOne({ slug }).lean();
    if (existing) {
      console.log(`[skip] already exists: ${society.name}`);
      skipped += 1;
      continue;
    }

    await ServerModel.create({
      name: society.name,
      slug,
      type: 'citysocieties',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[ok] seeded: ${society.name}`);
    inserted += 1;
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
}

main()
  .then(async () => mongoose.connection.close())
  .catch((err) => {
    console.error('Society seed failed:', err);
    void mongoose.connection.close().finally(() => process.exit(1));
  });
