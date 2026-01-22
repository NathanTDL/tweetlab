import { supabase } from "./supabase";

// Daily limit for post analyses
export const DAILY_ANALYSIS_LIMIT = 8;

// Premium model limit (first N queries use the premium model)
export const PREMIUM_MODEL_LIMIT = 3;

interface UsageResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    isPremiumTier: boolean; // true if user is still within premium model quota
    premiumRemaining: number; // how many premium queries left
}

/**
 * Generate a unique anonymous ID for localStorage
 */
export function generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
}

/**
 * Get the reset time (midnight UTC)
 */
function getResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
}

/**
 * Check if user can perform an analysis and get remaining count
 * @param userId - The authenticated user's ID (if logged in)
 * @param anonymousId - The anonymous ID from localStorage (if not logged in)
 */
export async function checkUsageLimit(
    userId?: string,
    anonymousId?: string
): Promise<UsageResult> {
    const today = getTodayDate();
    const identifier = userId || anonymousId;

    if (!identifier) {
        // No identifier means we can't track - allow but warn
        console.warn("No user ID or anonymous ID provided for usage tracking");
        return {
            allowed: true,
            remaining: DAILY_ANALYSIS_LIMIT,
            resetAt: getResetTime(),
            isPremiumTier: true,
            premiumRemaining: PREMIUM_MODEL_LIMIT,
        };
    }

    try {
        // Check for existing usage record
        const query = userId
            ? supabase.from("usage_tracking").select("*").eq("user_id", userId).eq("reset_date", today)
            : supabase.from("usage_tracking").select("*").eq("anonymous_id", anonymousId).eq("reset_date", today);

        const { data, error } = await query.single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows returned, which is fine for new users
            console.error("Error checking usage:", error);
            // Allow on error to not break the app
            return {
                allowed: true,
                remaining: DAILY_ANALYSIS_LIMIT,
                resetAt: getResetTime(),
                isPremiumTier: true,
                premiumRemaining: PREMIUM_MODEL_LIMIT,
            };
        }

        const currentCount = data?.analysis_count || 0;
        const remaining = Math.max(0, DAILY_ANALYSIS_LIMIT - currentCount);
        const premiumRemaining = Math.max(0, PREMIUM_MODEL_LIMIT - currentCount);

        return {
            allowed: remaining > 0,
            remaining,
            resetAt: getResetTime(),
            isPremiumTier: premiumRemaining > 0,
            premiumRemaining,
        };
    } catch (error) {
        console.error("Usage check failed:", error);
        return {
            allowed: true,
            remaining: DAILY_ANALYSIS_LIMIT,
            resetAt: getResetTime(),
            isPremiumTier: true,
            premiumRemaining: PREMIUM_MODEL_LIMIT,
        };
    }
}

/**
 * Increment usage count for a user
 * @param userId - The authenticated user's ID (if logged in)
 * @param anonymousId - The anonymous ID from localStorage (if not logged in)
 */
export async function incrementUsage(
    userId?: string,
    anonymousId?: string
): Promise<boolean> {
    const today = getTodayDate();
    const identifier = userId || anonymousId;

    if (!identifier) {
        console.warn("No identifier for usage increment");
        return false;
    }

    try {
        // Try to upsert the usage record
        const record = userId
            ? { user_id: userId, anonymous_id: null, reset_date: today, analysis_count: 1 }
            : { user_id: null, anonymous_id: anonymousId, reset_date: today, analysis_count: 1 };

        // First, check if record exists
        const checkQuery = userId
            ? supabase.from("usage_tracking").select("id, analysis_count").eq("user_id", userId).eq("reset_date", today)
            : supabase.from("usage_tracking").select("id, analysis_count").eq("anonymous_id", anonymousId).eq("reset_date", today);

        const { data: existing } = await checkQuery.single();

        if (existing) {
            // Update existing record
            await supabase
                .from("usage_tracking")
                .update({ analysis_count: existing.analysis_count + 1, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
        } else {
            // Insert new record
            await supabase.from("usage_tracking").insert(record);
        }

        return true;
    } catch (error) {
        console.error("Usage increment failed:", error);
        return false;
    }
}

/**
 * Get current usage stats for a user
 */
export async function getUsageStats(
    userId?: string,
    anonymousId?: string
): Promise<{ used: number; remaining: number; limit: number; resetAt: Date }> {
    const result = await checkUsageLimit(userId, anonymousId);
    return {
        used: DAILY_ANALYSIS_LIMIT - result.remaining,
        remaining: result.remaining,
        limit: DAILY_ANALYSIS_LIMIT,
        resetAt: result.resetAt,
    };
}
