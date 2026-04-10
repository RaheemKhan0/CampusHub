import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDB } from '../../lib/connectMongodb';
import { ServerModel } from '../schemas/server.schema';
import { type SocietyCategory } from '../types';

const societies: { name: string; category: SocietyCategory }[] = [
  // Sports & Fitness
  { name: 'City Football Club',          category: 'Sports & Fitness' },
  { name: 'Basketball Society',          category: 'Sports & Fitness' },
  { name: 'Tennis Club',                 category: 'Sports & Fitness' },
  { name: 'Swimming & Water Polo',       category: 'Sports & Fitness' },
  { name: 'Badminton Society',           category: 'Sports & Fitness' },
  { name: 'Volleyball Club',             category: 'Sports & Fitness' },
  { name: 'Cycling Society',             category: 'Sports & Fitness' },
  { name: 'Martial Arts Society',        category: 'Sports & Fitness' },

  // Academic & Professional
  { name: 'Computer Science Society',    category: 'Academic & Professional' },
  { name: 'Mathematics Society',         category: 'Academic & Professional' },
  { name: 'Law Society',                 category: 'Academic & Professional' },
  { name: 'Economics & Finance Society', category: 'Academic & Professional' },
  { name: 'Engineering Society',         category: 'Academic & Professional' },
  { name: 'Psychology Society',          category: 'Academic & Professional' },
  { name: 'Debate Society',              category: 'Academic & Professional' },
  { name: 'Model United Nations',        category: 'Academic & Professional' },

  // Arts & Culture
  { name: 'Film & Media Society',        category: 'Arts & Culture' },
  { name: 'Photography Society',         category: 'Arts & Culture' },
  { name: 'Music Society',               category: 'Arts & Culture' },
  { name: 'Drama & Theatre Society',     category: 'Arts & Culture' },
  { name: 'Art & Design Society',        category: 'Arts & Culture' },

  // Community & Lifestyle
  { name: 'Gaming Society',                      category: 'Community & Lifestyle' },
  { name: 'Chess Club',                          category: 'Community & Lifestyle' },
  { name: 'Cooking & Food Society',              category: 'Community & Lifestyle' },
  { name: 'Entrepreneurship Society',            category: 'Community & Lifestyle' },
  { name: 'Volunteering & Community Outreach',   category: 'Community & Lifestyle' },
  { name: 'Environmental & Sustainability Society', category: 'Community & Lifestyle' },
  { name: 'International Students Society',      category: 'Community & Lifestyle' },
];

async function main() {
  await connectDB();

  const deleted = await ServerModel.deleteMany({ type: 'citysocieties' });
  console.log(`Cleared ${deleted.deletedCount} existing society records.`);

  let inserted = 0;

  for (const society of societies) {
    const slug = slugify(society.name, { lower: true, strict: true });

    await ServerModel.create({
      name: society.name,
      slug,
      type: 'citysocieties',
      category: society.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[ok] seeded: ${society.name} (${society.category})`);
    inserted += 1;
  }

  console.log(`\nDone — ${inserted} inserted.`);
}

main()
  .then(async () => mongoose.connection.close())
  .catch((err) => {
    console.error('Society seed failed:', err);
    void mongoose.connection.close().finally(() => process.exit(1));
  });
