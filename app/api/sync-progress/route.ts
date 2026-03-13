import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let studentId: string;
  let progress: Record<string, unknown>;
  try {
    const body = await req.json();
    studentId = body.studentId;
    progress = body.progress;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!studentId || !progress) {
    return Response.json({ error: "studentId and progress required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify this student belongs to the authenticated parent
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  // Whitelist allowed fields to prevent arbitrary column writes
  const allowed: Record<string, unknown> = {};
  const SAFE_KEYS = [
    "xp", "level", "mastery_level", "unlocked_modes",
    "daily_xp", "daily_goal", "last_session_date",
    "consecutive_days", "lifetime_matches", "lifetime_smashes",
    "lifetime_merges", "discovered_equivalences",
  ];
  for (const key of SAFE_KEYS) {
    if (key in progress) allowed[key] = progress[key];
  }

  const { error } = await supabase
    .from("student_progress")
    .update({
      ...allowed,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", studentId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
