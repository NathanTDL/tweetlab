import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL
        ? `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth`
        : "http://localhost:3000/api/auth",
});

// Export commonly used functions
export const { signIn, signOut, useSession, getSession } = authClient;
