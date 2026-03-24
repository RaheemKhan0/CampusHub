import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { AppUser, IUser } from 'src/database/schemas/user.schema';
import { customSession, openAPI } from 'better-auth/plugins';
const mongoUri = process.env.MONGO_URI ?? '';
export const mongoClient = new MongoClient(mongoUri);
// Optional: choose DB explicitly via MONGO_DB (otherwise URI's db is used)
export const db = mongoClient.db();

/* eslint-disable @typescript-eslint/require-await */
export const auth = betterAuth({
  basePath: '/api/auth',
  plugins: [
    openAPI(),
    customSession(async ({ user, session }) => {
      const isSuper = user.email === process.env.SUPER_USER_EMAIL;
      const appuser = await AppUser.findOne({ userId: user.id }).lean<IUser>();
      return {
        user: {
          ...user,
          isSuper: isSuper,
          degreeSlug: appuser?.degreeSlug,
          startYear: appuser?.startYear,
        },
        session,
      };
    }),
  ],
  trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:3000'],
  database: mongodbAdapter(db),
  user: {
    additionalFields: {
      isSuper: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      degreeSlug: {
        type: 'string',
        required: true,
        input: true,
      },
      startYear: {
        type: 'number',
        required: true,
        input: true,
      },
    },
  },

  // Email + password now
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Dev stub: print verification link to console
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`[dev] [betterAuth] Verification for ${user.email}: ${url}`);
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (process.env.SUPER_USER_EMAIL == user.email.trim().toLowerCase()) {
            return {
              data: {
                ...user,
                isSuper: true,
              },
            };
          }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Adjust this path to match your sign-up route if different
      if (ctx.path !== '/sign-up/email') return;

      const body = ctx.body as Record<string, unknown> | undefined;
      const rawEmail = body?.email;
      const email =
        typeof rawEmail === 'string'
          ? rawEmail.trim().toLowerCase()
          : undefined;
      if (!email) {
        throw new APIError('BAD_REQUEST', { message: 'Email is required' });
      }

      const domain = email.split('@')[1]?.toLowerCase();
      const allowlist = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'city.ac.uk')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const ok =
        !!domain &&
        allowlist.some((d) => domain === d || domain.endsWith(`.${d}`));
      if (!ok) {
        throw new APIError('BAD_REQUEST', {
          message: `Only institutional emails allowed (${allowlist.join(', ')})`,
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // This runs after any auth endpoint. Narrow it to the email sign-up endpoint:

      if (ctx.path !== '/sign-up/email') return;

      console.log('Creating an account in the local database');
      // After-hooks expose the newly created session here:
      const newSession = ctx.context.newSession;
      const user = newSession?.user; // Better Auth user
      if (!user) return;

      // Idempotent upsert of your app-side user document
      await AppUser.updateOne(
        { userId: user.id }, // link by BA user id
        {
          $setOnInsert: {
            userId: user.id,
            email: user.email,
            name: user.name ?? '',
            isSuper: user?.isSuper,
            degreeSlug: user?.degreeSlug,
            startYear: user?.startYear,
          },
        },
        { upsert: true },
      );
    }),
  },
});

/* eslint-enable @typescript-eslint/require-await */

export type Session = typeof auth.$Infer.Session;
