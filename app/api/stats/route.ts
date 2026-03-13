import { getSessionStats } from "@/lib/ai/langsmith";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Require authenticated user — stats contain internal cost data
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(getSessionStats());
}
