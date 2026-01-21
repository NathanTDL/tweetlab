import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        // Get current session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user's post history
        const { data, error } = await supabase
            .from("post_history")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("History fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch history" },
                { status: 500 }
            );
        }

        return NextResponse.json({ history: data });
    } catch (error) {
        console.error("History API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
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

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing id" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("post_history")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id);

        if (error) {
            console.error("History delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete history" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("History API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
