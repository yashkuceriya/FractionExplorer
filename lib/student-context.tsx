"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress, type PlayerProgress } from "@/lib/progress";
import { setActiveStudentId } from "@/lib/active-student-id";

export type Difficulty = "beginner" | "intermediate" | "expert";

export interface Student {
  id: string;
  name: string;
  avatar_emoji: string;
  difficulty: Difficulty;
  voice_character_id: string;
}

interface StudentContextType {
  student: Student | null;
  progress: PlayerProgress | null;
  difficulty: Difficulty;
  isGuest: boolean;
  setActiveStudent: (student: Student) => void;
  clearStudent: () => void;
  syncProgress: () => void;
}

const StudentContext = createContext<StudentContextType>({
  student: null,
  progress: null,
  difficulty: "beginner",
  isGuest: true,
  setActiveStudent: () => {},
  clearStudent: () => {},
  syncProgress: () => {},
});

export function useStudent() {
  return useContext(StudentContext);
}

const ACTIVE_STUDENT_KEY = "active-student";

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load active student from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ACTIVE_STUDENT_KEY);
      if (raw) {
        const s: Student = JSON.parse(raw);
        setActiveStudentId(s.id); // Scope localStorage before any loads
        setStudent(s);
        loadProgressFromServer(s.id);
      } else {
        // Guest mode — use localStorage
        setProgress(loadProgress());
      }
    } catch {
      setProgress(loadProgress());
    }
  }, []);

  async function loadProgressFromServer(studentId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("student_progress")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (data) {
        const p: PlayerProgress = {
          xp: data.xp,
          level: data.level,
          masteryLevel: data.mastery_level,
          unlockedModes: data.unlocked_modes,
          dailyXP: data.daily_xp,
          dailyGoal: data.daily_goal,
          lastSessionDate: data.last_session_date,
          consecutiveDays: data.consecutive_days,
          lifetimeMatches: data.lifetime_matches,
          lifetimeSmashes: data.lifetime_smashes,
          lifetimeMerges: data.lifetime_merges,
          discoveredEquivalences: data.discovered_equivalences,
        };
        setProgress(p);
        // Also write to localStorage so existing components work
        saveProgress(p);
      } else {
        setProgress(loadProgress());
      }
    } catch {
      setProgress(loadProgress());
    }
  }

  const syncProgress = useCallback(() => {
    if (!student) return;

    // Debounce — wait 3s after last call
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const p = loadProgress();
      setProgress(p);

      try {
        const supabase = createClient();
        await supabase
          .from("student_progress")
          .update({
            xp: p.xp,
            level: p.level,
            mastery_level: p.masteryLevel,
            unlocked_modes: p.unlockedModes,
            daily_xp: p.dailyXP,
            daily_goal: p.dailyGoal,
            last_session_date: p.lastSessionDate,
            consecutive_days: p.consecutiveDays,
            lifetime_matches: p.lifetimeMatches,
            lifetime_smashes: p.lifetimeSmashes,
            lifetime_merges: p.lifetimeMerges,
            discovered_equivalences: p.discoveredEquivalences,
            updated_at: new Date().toISOString(),
          })
          .eq("student_id", student.id);
      } catch {
        // Offline — localStorage is the fallback
      }
    }, 3000);
  }, [student]);

  function buildProgressPayload(p: PlayerProgress) {
    return {
      xp: p.xp,
      level: p.level,
      mastery_level: p.masteryLevel,
      unlocked_modes: p.unlockedModes,
      daily_xp: p.dailyXP,
      daily_goal: p.dailyGoal,
      last_session_date: p.lastSessionDate,
      consecutive_days: p.consecutiveDays,
      lifetime_matches: p.lifetimeMatches,
      lifetime_smashes: p.lifetimeSmashes,
      lifetime_merges: p.lifetimeMerges,
      discovered_equivalences: p.discoveredEquivalences,
    };
  }

  // Sync on page unload via same-origin API (sendBeacon includes cookies)
  // and periodically (every 30s) as a safety net.
  useEffect(() => {
    if (!student) return;

    function handleUnload() {
      if (!student) return;
      const p = loadProgress();
      const blob = new Blob(
        [JSON.stringify({ studentId: student.id, progress: buildProgressPayload(p) })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/sync-progress", blob);
    }

    const periodicSync = setInterval(async () => {
      if (!student) return;
      const p = loadProgress();
      setProgress(p);
      try {
        const supabase = createClient();
        await supabase
          .from("student_progress")
          .update({ ...buildProgressPayload(p), updated_at: new Date().toISOString() })
          .eq("student_id", student.id);
      } catch {
        // Offline — localStorage is the fallback
      }
    }, 30000);

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(periodicSync);
    };
  }, [student]);

  const setActiveStudent = useCallback((s: Student) => {
    setActiveStudentId(s.id); // Scope all localStorage keys to this student
    setStudent(s);
    sessionStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify(s));
    loadProgressFromServer(s.id);
  }, []);

  const clearStudent = useCallback(() => {
    setActiveStudentId(null); // Back to guest (global) storage
    setStudent(null);
    sessionStorage.removeItem(ACTIVE_STUDENT_KEY);
    setProgress(loadProgress());
  }, []);

  const difficulty: Difficulty = student?.difficulty ?? "beginner";

  return (
    <StudentContext.Provider
      value={{
        student,
        progress,
        difficulty,
        isGuest: !student,
        setActiveStudent,
        clearStudent,
        syncProgress,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
