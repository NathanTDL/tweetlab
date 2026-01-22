import { NextRequest, NextResponse } from "next/server";
import { simulateTweet } from "@/lib/openrouter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tweet, imageBase64, imageMimeType, anonymousId } = body;

        if (!tweet || typeof tweet !== "string") {
            return NextResponse.json(
                { error: "Tweet content is required" },
                { status: 400 }
            );
        }

        if (tweet.length > 280) {
            return NextResponse.json(
                { error: "Tweet exceeds 280 characters" },
                { status: 400 }
            );
        }

        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const userId = session?.user?.id;

        // Check usage limits
        const usageResult = await checkUsageLimit(userId, anonymousId);
        if (!usageResult.allowed) {
            return NextResponse.json(
                {
                    error: "Daily analysis limit reached. You can analyze up to 8 posts per day.",
                    remaining: 0,
                    resetAt: usageResult.resetAt.toISOString(),
                },
                { status: 429 }
            );
        }

        // Fetch user context if authenticated
        let userContext = undefined;
        if (session?.user) {
            const { data: user } = await (await import("@/lib/supabase")).supabase
                .from("user")
                .select("bio, target_audience, ai_context")
                .eq("id", session.user.id)
                .single();

            if (user) {
                userContext = {
                    bio: user.bio,
                    targetAudience: user.target_audience,
                    aiContext: user.ai_context
                };
            }
        }

        // Prepare image data if provided
        const imageData = imageBase64 && imageMimeType
            ? { base64: imageBase64, mimeType: imageMimeType }
            : undefined;

        // Determine model tier (first 3 queries get premium model)
        const usePremium = usageResult.isPremiumTier;

        const analysis = await simulateTweet(tweet, userContext, imageData, usePremium);

        // Increment usage after successful analysis
        await incrementUsage(userId, anonymousId);

        // Fire and forget stats increment and history save
        try {
            const { supabase } = await import("@/lib/supabase");
            await supabase.rpc('increment_stat', { stat_key: 'total_simulations' });

            if (session?.user) {
                await supabase.from("post_history").insert({
                    user_id: session.user.id,
                    tweet_content: tweet,
                    analysis: analysis,
                });
            }
        } catch (err) {
            console.error("Failed to increment stats or save history:", err);
        }

        // Include remaining analyses and tier info in response
        const newUsage = await checkUsageLimit(userId, anonymousId);

        return NextResponse.json({
            ...analysis,
            _usage: {
                remaining: newUsage.remaining,
                resetAt: newUsage.resetAt.toISOString(),
            },
            _tierInfo: {
                isPremiumTier: usePremium,
                premiumRemaining: usageResult.premiumRemaining,
            }
        });
    } catch (error) {
        console.error("Simulation error:", error);
        return NextResponse.json(
            { error: "Failed to simulate tweet. Please try again." },
            { status: 500 }
        );
    }
}
