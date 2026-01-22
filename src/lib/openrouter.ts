import { OpenRouter } from "@openrouter/sdk";
import { z } from "zod";

// Initialize OpenRouter client
const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Model tiers: Premium for first 3 queries, Lite after
const PREMIUM_MODEL_ID = "google/gemini-2.5-flash";
const LITE_MODEL_ID = "google/gemini-2.5-flash-lite";


// X Algorithm-Aware Simulation Prompt (Jan 2026 update)
const SIMULATION_PROMPT = `You are an expert X (Twitter) engagement analyst with deep knowledge of the 2026 algorithm.

CRITICAL ALGORITHM FACTS YOU MUST USE:
- REPLIES are 75x more valuable than likes for reach
- Bookmarks/DM shares have 50x engagement multiplier
- First 15-30 minutes of engagement determines viral potential (Phoenix algo)
- Dwell time (how long users stop scrolling) is a core metric
- External links are PENALIZED (reduces off-platform traffic)
- Over-posting (4+/day) triggers diversity penalties
- Controversy and curiosity hooks trigger broader distribution

YOUR TASK: Analyze this tweet HONESTLY. No sugarcoating. If it's weak, say so.

RULES:
- Single-word tweets get LOW scores and critical analysis
- Generic tweets ("hi", "gm", "good morning") should score VERY LOW
- Predictions must be REALISTIC, not inflated
- ALL audience_reactions MUST be filled with specific, varied responses
- Suggestions must IMPROVE reply potential specifically

RESPOND WITH VALID JSON ONLY. No markdown, no explanation, just the JSON object.`;

const CHAT_PROMPT = `TweetLab AI. Help improve tweets. Be concise.

Context:`;

// Zod schema for structured tweet analysis output
const TweetAnalysisSchema = z.object({
    tweet: z.string(),
    predicted_likes: z.number(),
    predicted_retweets: z.number(),
    predicted_replies: z.number(),
    predicted_quotes: z.number(),
    predicted_views: z.number(),
    engagement_outlook: z.enum(["Low", "Medium", "High"]),
    engagement_justification: z.string(),
    analysis: z.array(z.string()),
    suggestions: z.array(z.object({
        version: z.string(),
        tweet: z.string(),
        reason: z.string(),
        audience_reactions: z.array(z.string()),
    })),
});

export type TweetAnalysis = z.infer<typeof TweetAnalysisSchema>;

interface UserContext {
    bio?: string;
    targetAudience?: string;
    aiContext?: string;
}

interface ImageData {
    base64: string;
    mimeType: string;
}

// JSON output format template for structured responses
const JSON_FORMAT = `{
  "tweet": "original tweet text",
  "predicted_likes": <10-2000 realistic>,
  "predicted_retweets": <1-200 realistic>,
  "predicted_replies": <0-50 realistic - THIS IS THE MOST IMPORTANT METRIC>,
  "predicted_quotes": <0-20>,
  "predicted_views": <50-50000 realistic based on content quality>,
  "engagement_outlook": "Low" | "Medium" | "High",
  "engagement_justification": "Brutally honest 1-2 sentence assessment. If the tweet is weak, generic, or lacks a hook - SAY SO. Mention specific algorithm factors.",
  "analysis": [
    "Hook: Does it stop the scroll in first 5 words? Be critical.",
    "Reply Potential: Will people WANT to respond? Why/why not?",
    "Dwell: Will users pause or scroll past? What would make them stay?",
    "Share Value: Is this bookmark/retweet worthy? Be honest."
  ],
  "suggestions": [
    {
      "version": "Curiosity",
      "tweet": "REWRITE to create information gap. MUST keep same format (emojis, line breaks, length).",
      "reason": "WHY this version will get more REPLIES (primary metric). Max 20 words.",
      "audience_reactions": ["Specific reaction 1", "Specific reaction 2", "Specific reaction 3"]
    },
    {
      "version": "Authority",
      "tweet": "REWRITE with confident, expert voice. Same format as original.",
      "reason": "WHY this establishes expertise and drives engagement.",
      "audience_reactions": ["Reaction 1", "Reaction 2", "Reaction 3"]
    },
    {
      "version": "Controversy",
      "tweet": "REWRITE to challenge assumptions (NOT toxic). Same format.",
      "reason": "WHY this triggers debate and sharing (Phoenix algo boost).",
      "audience_reactions": ["Reaction 1", "Reaction 2", "Reaction 3"]
    }
  ]
}`;

// Type for OpenRouter message content items
type MessageContent =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

export async function simulateTweet(
    tweetContent: string,
    context?: UserContext,
    imageData?: ImageData,
    usePremium: boolean = true
): Promise<TweetAnalysis> {
    try {
        let systemPrompt = SIMULATION_PROMPT;
        if (context?.targetAudience) {
            systemPrompt += `\n[Audience: ${context.targetAudience}]`;
        }

        // Build message content array with proper types
        const content: MessageContent[] = [];

        if (imageData) {
            content.push({
                type: "image_url" as const,
                image_url: {
                    url: `data:${imageData.mimeType};base64,${imageData.base64}`,
                },
            });
        }

        content.push({
            type: "text" as const,
            text: `Tweet to analyze: "${tweetContent}"\n\nOUTPUT FORMAT (JSON only):\n${JSON_FORMAT}`,
        });

        const response = await openrouter.chat.send({
            model: usePremium ? PREMIUM_MODEL_ID : LITE_MODEL_ID,
            messages: [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: content as unknown as string },
            ],
            stream: false,
        });

        // Extract text from response
        const rawContent = response.choices?.[0]?.message?.content;
        const text = typeof rawContent === "string" ? rawContent : "";

        // Parse JSON from response
        const parsed = parseJsonResponse(text);
        return TweetAnalysisSchema.parse(parsed);
    } catch (error) {
        console.error("Simulation error:", error);
        throw error;
    }
}

export async function chatWithAI(message: string, tweetContext?: string, usePremium: boolean = true): Promise<string> {
    try {
        const systemPrompt = tweetContext
            ? `${CHAT_PROMPT} "${tweetContext}"`
            : `${CHAT_PROMPT} None`;

        const response = await openrouter.chat.send({
            model: usePremium ? PREMIUM_MODEL_ID : LITE_MODEL_ID,
            messages: [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: message },
            ],
            stream: false,
        });

        const rawContent = response.choices?.[0]?.message?.content;
        return typeof rawContent === "string" ? rawContent : "Please try again.";
    } catch (error) {
        console.error("Chat error:", error);
        throw error;
    }
}

export async function* simulateTweetStream(
    tweetContent: string,
    context?: UserContext,
    imageData?: ImageData,
    usePremium: boolean = true
): AsyncGenerator<{ partial?: string; complete?: boolean; analysis?: TweetAnalysis | { error: string } }> {
    try {
        let systemPrompt = SIMULATION_PROMPT;
        if (context?.targetAudience) {
            systemPrompt += `\n[Audience: ${context.targetAudience}]`;
        }

        // Build message content array with proper types
        const content: MessageContent[] = [];

        if (imageData) {
            content.push({
                type: "image_url" as const,
                image_url: {
                    url: `data:${imageData.mimeType};base64,${imageData.base64}`,
                },
            });
        }

        content.push({
            type: "text" as const,
            text: `Tweet to analyze: "${tweetContent}"\n\nOUTPUT FORMAT (JSON only):\n${JSON_FORMAT}`,
        });

        const stream = await openrouter.chat.send({
            model: usePremium ? PREMIUM_MODEL_ID : LITE_MODEL_ID,
            messages: [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: content as unknown as string },
            ],
            stream: true,
        });

        let fullText = "";

        for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
                fullText += delta;
                yield { partial: fullText };
            }
        }

        // Parse the final result
        try {
            const parsed = parseJsonResponse(fullText);
            yield { complete: true, analysis: parsed as TweetAnalysis };
        } catch {
            yield { complete: true, analysis: { error: "Parse failed" } };
        }
    } catch (error) {
        console.error("Stream error:", error);
        throw error;
    }
}

// Helper to parse JSON from AI response
function parseJsonResponse(text: string): unknown {
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    return JSON.parse(cleanedText);
}
