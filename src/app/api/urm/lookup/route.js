import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leeftijd = parseInt(searchParams.get("leeftijd") || "45");
  const equityPct = parseInt(searchParams.get("equity_pct") || "60");

  const { data, error } = await supabase
    .from("actieve_urm_lookup")
    .select("p5_factor, p50_factor, p95_factor, kwartaal")
    .eq("leeftijd", leeftijd)
    .eq("equity_pct", equityPct)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
