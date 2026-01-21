import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        // Fetch top performing posts globally
        // We really want to join with user data, but since we don't have a public 'users' table 
        // that's easily joined in this context (auth.users is protected), 
        // we might have to rely on what's in post_history or do a client-side trick 
        // BUT for now, let's assume post_history has the data we need (it doesn't have user name/avatar).
        // EDIT: We can't easily get user name/avatar from just post_history if it's not stored there.
        // CHECK: post_history schema. 
        // If we can't get it, we'll have to use placeholders or 'Anonymous' until we fix the schema.
        // Actually, let's just fetch the analysis data which has the scores.

        // Fetch top performing posts globally joined with user data
        // Explicitly select user fields needed
        const { data, error } = await supabase
            .from("post_history")
            .select(`
                *,
                user:user_id (
                    name,
                    image,
                    x_handle,
                    leaderboard_mode
                )
            `)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Leaderboard fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch leaderboard" },
                { status: 500 }
            );
        }

        // Calculate score, sort, and process privacy
        const leaderboardData = data
            .map((item: any) => {
                const analysis = item.analysis;
                const score = analysis ?
                    (analysis.predicted_likes * 1 +
                        analysis.predicted_retweets * 2 +
                        analysis.predicted_replies * 3 +
                        analysis.predicted_views * 0.01) / 100
                    : 0;

                const user = item.user;
                const mode = user?.leaderboard_mode || 'none';

                // Skip if mode is 'none' (not participating)
                if (mode === 'none') return null;

                // Process anonymity
                const isAnonymous = mode === 'anonymous';

                return {
                    id: item.id,
                    tweet_content: item.tweet_content,
                    created_at: item.created_at,
                    analysis: item.analysis,
                    calculated_score: Math.min(Math.round(score), 100),
                    user: {
                        name: isAnonymous ? "Anonymous User" : (user?.name || "Simulated User"),
                        handle: isAnonymous ? "" : (user?.x_handle || ""),
                        image: isAnonymous ? "" : (user?.image || ""), // Frontend will handle empty image
                        is_anonymous: isAnonymous
                    }
                };
            })
            .filter((item: any) => item !== null) // Remove non-participating
            .sort((a: any, b: any) => b.calculated_score - a.calculated_score)
            .slice(0, 50);

        return NextResponse.json({ leaderboard: leaderboardData });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
