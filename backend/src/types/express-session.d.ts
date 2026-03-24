import 'express-serve-static-core';
import { Session } from 'src/lib/betterauth';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Better Auth session attached by the AuthGuard
     */
    session?: Session;
    /**
     * Convenience reference to the session user (Better Auth attaches this too)
     */
    user?: Session['user'];
  }
}
