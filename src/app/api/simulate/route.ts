import { NextRequest, NextResponse } from "next/server";
import { simulateTweet } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tweet, imageBase64, imageMimeType } = body;

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

        // Fetch user context if authenticated
        let userContext = undefined;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

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

        const analysis = await simulateTweet(tweet, userContext, imageData);

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

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Simulation error:", error);
        return NextResponse.json(
            { error: "Failed to simulate tweet. Please try again." },
            { status: 500 }
        );
    }
}
