import { NextRequest } from "next/server";
import { simulateTweetStream } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tweet, imageBase64, imageMimeType } = body;

        if (!tweet || typeof tweet !== "string") {
            return new Response(JSON.stringify({ error: "Tweet content is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Limit check removed to allow long posts simulation
        // if (tweet.length > 280) { ... }

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

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const encoder = new TextEncoder();

                    let finalAnalysis: any = null;

                    // Stream the analysis
                    for await (const chunk of simulateTweetStream(tweet, userContext, imageData)) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        if (chunk.complete) {
                            finalAnalysis = chunk.analysis;
                        }
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();

                    // Fire and forget stats increment and history save
                    try {
                        const { supabase } = await import("@/lib/supabase");

                        // Increment global stats
                        await supabase.rpc('increment_stat', { stat_key: 'total_simulations' });

                        // Save to history if user is logged in
                        if (session?.user?.id && finalAnalysis && !finalAnalysis.error) {
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
