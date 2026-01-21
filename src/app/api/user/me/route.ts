import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
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

        // Fetch full user data including new columns
        const { data: user, error } = await supabase
            .from("user")
            .select("*")
            .eq("id", session.user.id)
            .single();

        if (error) {
            console.error("Fetch user error:", error);
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("User API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
