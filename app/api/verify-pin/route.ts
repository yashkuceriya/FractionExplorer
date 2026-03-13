import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let studentId: string;
  let pin: string;
  try {
    const body = await req.json();
    studentId = body.studentId;
    pin = body.pin;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!studentId || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return Response.json({ error: "studentId and 4-digit pin required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: student, error } = await supabase
    .from("students")
    .select("id, name, avatar_emoji, difficulty, voice_character_id, pin")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (error || !student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  if (student.pin !== pin) {
    return Response.json({ verified: false }, { status: 200 });
  }

  const { pin: _pin, ...safeStudent } = student;
  void _pin;
  return Response.json({ verified: true, student: safeStudent }, { status: 200 });
}
