import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:4000" // The base URL of your auth server
})
