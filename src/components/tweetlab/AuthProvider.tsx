"use client";

import { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface AuthProviderProps {
    children: ReactNode;
}

// Simple auth provider wrapper - Better Auth handles state automatically
export function AuthProvider({ children }: AuthProviderProps) {
    return <>{children}</>;
}

// Export auth client for use in components
export { authClient };
