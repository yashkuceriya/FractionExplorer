"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { LEVEL_NAMES, LEVEL_EMOJIS } from "@/lib/progress";
import type { Difficulty } from "@/lib/student-context";

interface StudentWithProgress {
  id: string;
  name: string;
  avatar_emoji: string;
  difficulty: Difficulty;
  created_at: string;
  progress: {
    xp: number;
    level: number;
    daily_xp: number;
    daily_goal: number;
    consecutive_days: number;
    lifetime_matches: number;
    discovered_equivalences: string[];
    updated_at: string;
  } | null;
  badges: string[];
}

export default function ParentDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setParentEmail(user.email ?? "");

      const { data: studentRows, error: studentsError } = await supabase
        .from("students")
        .select("id, name, avatar_emoji, difficulty, created_at")
        .order("created_at");

      if (studentsError) {
        setLoadError("Could not load students.");
        setLoading(false);
        return;
      }

      if (!studentRows || studentRows.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = studentRows.map((s) => s.id);

      const [progressResult, badgesResult] = await Promise.all([
        supabase
          .from("student_progress")
          .select("*")
          .in("student_id", studentIds),
        supabase
          .from("student_badges")
          .select("student_id, badge_id")
          .in("student_id", studentIds),
      ]);

      const progressMap = new Map(
        (progressResult.data ?? []).map((p) => [p.student_id, p])
      );
      const badgesMap = new Map<string, string[]>();
      for (const b of badgesResult.data ?? []) {
        const arr = badgesMap.get(b.student_id) ?? [];
        arr.push(b.badge_id);
        badgesMap.set(b.student_id, arr);
      }

      const result: StudentWithProgress[] = studentRows.map((s) => ({
        ...s,
        progress: progressMap.get(s.id) ?? null,
        badges: badgesMap.get(s.id) ?? [],
      }));

      setStudents(result);
    } catch (err) {
      console.error("Dashboard loadData error:", err);
      setLoadError("Something went wrong loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear active student session so reload doesn't bypass PIN
    try { sessionStorage.clear(); } catch {}
    router.push("/login");
  }

  async function updateDifficulty(studentId: string, difficulty: Difficulty) {
    const supabase = createClient();
    const { error } = await supabase.from("students").update({ difficulty }).eq("id", studentId);
    if (error) {
      console.error("Failed to update difficulty:", error);
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, difficulty } : s))
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <p className="text-purple-600 font-bold">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-purple-800">Parent Dashboard</h1>
            <p className="text-xs text-purple-600">{parentEmail}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/pick-student")}
              className="px-3 py-2 bg-white border-2 border-pink-200 rounded-xl text-xs font-bold text-purple-700 active:scale-95 transition-transform"
            >
              Switch Student
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 active:scale-95 transition-transform"
            >
              Logout
            </button>
          </div>
        </div>

        {loadError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm font-bold text-red-600">{loadError}</p>
            <button onClick={() => { setLoadError(""); setLoading(true); loadData(); }} className="mt-2 text-xs font-bold text-red-500 underline">
              Retry
            </button>
          </div>
        )}

        {students.length === 0 && !loadError ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-pink-200 p-8 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-bold text-purple-800 mb-2">No students yet</p>
            <button
              onClick={() => router.push("/pick-student")}
              className="px-4 py-2 bg-pink-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
            >
              Add Your First Student
            </button>
          </div>
        ) : students.length > 0 ? (
          <div className="space-y-4">
            {students.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-pink-200 p-4"
              >
                {/* Student header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{s.avatar_emoji}</span>
                  <div className="flex-1">
                    <h2 className="font-black text-purple-800">{s.name}</h2>
                    <p className="text-xs text-purple-500">
                      {s.progress
                        ? `${LEVEL_EMOJIS[s.progress.level]} ${LEVEL_NAMES[s.progress.level]} — ${s.progress.xp} XP`
                        : "No progress yet"}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.progress && s.progress.consecutive_days > 1 && (
                      <p className="text-xs font-bold text-orange-500">
                        🔥 {s.progress.consecutive_days} day streak
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats grid */}
                {s.progress && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-pink-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-black text-purple-700">{s.progress.xp}</p>
                      <p className="text-[10px] font-bold text-purple-500">Total XP</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-black text-emerald-700">{s.progress.lifetime_matches}</p>
                      <p className="text-[10px] font-bold text-emerald-500">Matches</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-black text-blue-700">{s.progress.discovered_equivalences.length}</p>
                      <p className="text-[10px] font-bold text-blue-500">Discoveries</p>
                    </div>
                  </div>
                )}

                {/* Daily progress bar */}
                {s.progress && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-bold text-purple-600 mb-1">
                      <span>Today's Goal</span>
                      <span>{s.progress.daily_xp}/{s.progress.daily_goal} XP</span>
                    </div>
                    <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (s.progress.daily_xp / s.progress.daily_goal) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Difficulty selector */}
                <div>
                  <p className="text-[10px] font-bold text-purple-600 mb-1.5">Difficulty Level</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "beginner" as const, label: "Beginner", emoji: "🐢", desc: "Halves, thirds, quarters" },
                      { value: "intermediate" as const, label: "Medium", emoji: "🐇", desc: "Up to sixths & eighths" },
                      { value: "expert" as const, label: "Expert", emoji: "🚀", desc: "All denominators" },
                    ]).map((d) => (
                      <button
                        key={d.value}
                        onClick={() => updateDifficulty(s.id, d.value)}
                        className={`py-2 px-1 rounded-xl text-center transition-all ${
                          s.difficulty === d.value
                            ? "bg-pink-100 border-2 border-pink-400"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <p className="text-sm">{d.emoji}</p>
                        <p className={`text-[10px] font-bold ${s.difficulty === d.value ? "text-purple-800" : "text-gray-500"}`}>
                          {d.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Last active */}
                {s.progress?.updated_at && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Last active: {new Date(s.progress.updated_at).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : null}

        {/* Add student */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/pick-student")}
            className="text-xs font-bold text-purple-600"
          >
            + Add Another Student
          </button>
        </div>
      </div>
    </div>
  );
}
