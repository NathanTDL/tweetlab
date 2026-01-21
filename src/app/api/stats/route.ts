import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('platform_stats')
            .select('value')
            .eq('key', 'total_simulations')
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ total_simulations: data?.value || 0 });
    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ total_simulations: 0 }); // Fallback
    }
}
