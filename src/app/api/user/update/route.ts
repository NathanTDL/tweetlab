import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, image, bio, target_audience, ai_context, x_handle, leaderboard_mode } = await req.json();

        // Update user in Supabase
        const { error } = await supabase
            .from("user")
            .update({
                name,
                image,
                bio,
                target_audience,
                ai_context,
                x_handle,
                leaderboard_mode,
                updated_at: new Date().toISOString()
            })
            .eq("id", session.user.id);

        if (error) {
            console.error("Profile update error:", error);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
