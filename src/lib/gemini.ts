import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// X Algorithm-Aware Simulation Prompt (Jan 2026 update)
// Based on X's open-sourced recommendation algorithm
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

OUTPUT FORMAT (JSON only):
{
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
}

RULES:
- Single-word tweets get LOW scores and critical analysis
- Generic tweets ("hi", "gm", "good morning") should score VERY LOW
- Predictions must be REALISTIC, not inflated
- ALL audience_reactions MUST be filled with specific, varied responses
- Suggestions must IMPROVE reply potential specifically

Tweet to analyze:`;

const CHAT_PROMPT = `TweetLab AI. Help improve tweets. Be concise.

Context:`;

interface UserContext {
    bio?: string;
    targetAudience?: string;
    aiContext?: string;
}

interface ImageData {
    base64: string;
    mimeType: string;
}

export async function simulateTweet(tweetContent: string, context?: UserContext, imageData?: ImageData) {
    try {
        let prompt = SIMULATION_PROMPT;
        if (context?.targetAudience) {
            prompt += `\n[Audience: ${context.targetAudience}]`;
        }

        type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
        let contents: string | ContentPart[];
        if (imageData) {
            contents = [
                { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
                { text: `${prompt} "${tweetContent}"` },
            ];
        } else {
            contents = `${prompt} "${tweetContent}"`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text);
    } catch (error) {
        console.error("Simulation error:", error);
        throw error;
    }
}

export async function chatWithAI(message: string, tweetContext?: string) {
    try {
        const prompt = tweetContext
            ? `${CHAT_PROMPT} "${tweetContext}"\n\nUser: ${message} `
            : `${CHAT_PROMPT} None\n\nUser: ${message} `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Please try again.";
    } catch (error) {
        console.error("Chat error:", error);
        throw error;
    }
}

export async function* simulateTweetStream(
    tweetContent: string,
    context?: UserContext,
    imageData?: ImageData
): AsyncGenerator<{ partial?: string; complete?: boolean; analysis?: unknown }> {
    try {
        let prompt = SIMULATION_PROMPT;
        if (context?.targetAudience) {
            prompt += `\n[Audience: ${context.targetAudience}]`;
        }

        type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
        let contents: string | ContentPart[];
        if (imageData) {
            contents = [
                { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
                { text: `${prompt} "${tweetContent}"` },
            ];
        } else {
            contents = `${prompt} "${tweetContent}"`;
        }

        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents,
            config: {
                responseMimeType: "application/json",
            },
        });

        let fullText = "";
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                yield { partial: fullText };
            }
        }

        try {
            yield { complete: true, analysis: JSON.parse(fullText) };
        } catch {
            yield { complete: true, analysis: { error: "Parse failed" } };
        }
    } catch (error) {
        console.error("Stream error:", error);
        throw error;
    }
}
