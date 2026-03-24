import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:4000", // The base URL of auth server
  plugins: [
    inferAdditionalFields({
      user: {
        degreeSlug: {
          type: "string",
        },
        startYear : {
          type : 'number',
        },
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
