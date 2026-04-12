import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDB } from '../../lib/connectMongodb';
import { ServerModel } from '../schemas/server.schema';
import { Membership } from '../schemas/membership.schema';
import { AppUser } from '../schemas/user.schema';
import { type SocietyCategory } from '../types';
import { auth } from '../../lib/betterauth';

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

const DEFAULT_OWNER_EMAIL = 'student@city.ac.uk';
const DEFAULT_OWNER_PASSWORD = 'Task.board1';
const DEFAULT_OWNER_NAME = 'Student';

/**
 * Ensures the default owner user exists using Better Auth's own signUpEmail
 * API. This triggers the after-hook in betterauth.ts that auto-creates the
 * AppUser document. If the user already exists, we just look them up.
 */
async function ensureDefaultOwner(): Promise<string> {
  // Check if already registered
  const existingAppUser = await AppUser.findOne({ email: DEFAULT_OWNER_EMAIL })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (existingAppUser) {
    console.log(`[ok] Default owner already exists: ${DEFAULT_OWNER_EMAIL} (${existingAppUser.userId})`);
    return existingAppUser.userId;
  }

  // Use Better Auth's internal API to sign up — this handles password hashing,
  // BA user + account creation, and fires the after-hook that creates AppUser.
  console.log(`[info] Creating default owner via Better Auth: ${DEFAULT_OWNER_EMAIL}`);
  const result = await auth.api.signUpEmail({
    body: {
      email: DEFAULT_OWNER_EMAIL,
      password: DEFAULT_OWNER_PASSWORD,
      name: DEFAULT_OWNER_NAME,
      degreeSlug: 'bsc-hons-computer-science',
      startYear: 2024,
    },
  });

  const userId = result?.user?.id;
  if (!userId) {
    throw new Error(`Better Auth signUpEmail did not return a user id for ${DEFAULT_OWNER_EMAIL}`);
  }

  console.log(`[ok] Created user via Better Auth: ${DEFAULT_OWNER_EMAIL} (${userId})`);

  // The after-hook should have created AppUser, but verify
  const appUser = await AppUser.findOne({ userId })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!appUser) {
    // Fallback: after-hook didn't fire (can happen when calling api directly)
    await AppUser.create({
      userId,
      email: DEFAULT_OWNER_EMAIL,
      name: DEFAULT_OWNER_NAME,
      emailVerified: true,
      isSuper: false,
      degreeSlug: 'bsc-hons-computer-science',
      startYear: 2024,
    });
    console.log(`[ok] Created AppUser fallback for ${DEFAULT_OWNER_EMAIL}`);
  }

  return userId;
}

async function main() {
  await connectDB();

  // Clear existing society servers and their memberships
  const existingServers = await ServerModel.find({ type: 'citysocieties' }).select('_id').lean();
  const existingIds = existingServers.map((s) => s._id);
  if (existingIds.length) {
    await Membership.deleteMany({ serverId: { $in: existingIds } });
  }
  const deleted = await ServerModel.deleteMany({ type: 'citysocieties' });
  console.log(`Cleared ${deleted.deletedCount} existing society records.`);

  // Ensure the default owner user exists (creates via BA if missing)
  const ownerId = await ensureDefaultOwner();

  let inserted = 0;

  for (const society of societies) {
    const slug = slugify(society.name, { lower: true, strict: true });

    const server = await ServerModel.create({
      name: society.name,
      slug,
      type: 'citysocieties',
      category: society.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await Membership.create({
      serverId: server._id,
      userId: ownerId,
      roles: ['owner'],
      status: 'active',
      joinedAt: new Date(),
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
