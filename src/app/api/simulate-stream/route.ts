import { NextRequest } from "next/server";
import { simulateTweetStream } from "@/lib/openrouter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tweet, imageBase64, imageMimeType, anonymousId } = body;

        if (!tweet || typeof tweet !== "string") {
            return new Response(JSON.stringify({ error: "Tweet content is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const userId = session?.user?.id;

        // Check usage limits before starting stream
        const usageResult = await checkUsageLimit(userId, anonymousId);
        if (!usageResult.allowed) {
            return new Response(JSON.stringify({
                error: "Daily analysis limit reached. You can analyze up to 8 posts per day.",
                remaining: 0,
                resetAt: usageResult.resetAt.toISOString(),
            }), {
                status: 429,
                headers: { "Content-Type": "application/json" }
            });
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

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const encoder = new TextEncoder();

                    // Send tier info at the start
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        _tierInfo: {
                            isPremiumTier: usePremium,
                            premiumRemaining: usageResult.premiumRemaining,
                        }
                    })}\n\n`));

                    let finalAnalysis: unknown = null;
                    let success = false;

                    // Stream the analysis with model tier
                    for await (const chunk of simulateTweetStream(tweet, userContext, imageData, usePremium)) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        if (chunk.complete) {
                            finalAnalysis = chunk.analysis;
                            // Check if parsing succeeded (no error property)
                            success = finalAnalysis !== null &&
                                typeof finalAnalysis === 'object' &&
                                !('error' in (finalAnalysis as Record<string, unknown>));
                        }
                    }

                    // Only increment usage on successful analysis
                    if (success) {
                        await incrementUsage(userId, anonymousId);

                        // Get updated usage info
                        const newUsage = await checkUsageLimit(userId, anonymousId);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            _usage: {
                                remaining: newUsage.remaining,
                                resetAt: newUsage.resetAt.toISOString(),
                            }
                        })}\n\n`));
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();

                    // Fire and forget stats increment and history save
                    if (success) {
                        try {
                            const { supabase } = await import("@/lib/supabase");

                            // Increment global stats
                            await supabase.rpc('increment_stat', { stat_key: 'total_simulations' });

                            // Save to history if user is logged in
                            if (session?.user?.id && finalAnalysis && typeof finalAnalysis === 'object' && !('error' in finalAnalysis)) {
                                // Prepare image data string if exists
                                const imageDataString = imageData
                                    ? `data:${imageData.mimeType};base64,${imageData.base64}`
                                    : null;

                                await supabase.from("post_history").insert({
                                    user_id: session.user.id,
                                    tweet_content: tweet,
                                    analysis: finalAnalysis,
                                    image_data: imageDataString
                                });
                            }
                        } catch (err) {
                            console.error("Failed to save history/stats:", err);
                        }
                    }
                } catch (error) {
                    console.error("Streaming error:", error);
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Simulation error:", error);
        return new Response(JSON.stringify({ error: "Failed to simulate tweet. Please try again." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
