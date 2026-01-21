import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, tweetContext } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const response = await chatWithAI(message, tweetContext);

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to get AI response. Please try again." },
            { status: 500 }
        );
    }
}
