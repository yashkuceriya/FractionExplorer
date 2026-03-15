"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useStudent, type Difficulty } from "@/lib/student-context";
import PinEntry from "@/components/auth/PinEntry";

const AVATAR_OPTIONS = ["🦊", "🐸", "🦁", "🐼", "🦄", "🐯", "🐶", "🐱", "🐵", "🦋", "🐙", "🦜"];

interface StudentRow {
  id: string;
  name: string;
  avatar_emoji: string;
  difficulty: Difficulty;
  voice_character_id: string;
}

export default function PickStudentPage() {
  const router = useRouter();
  const { setActiveStudent } = useStudent();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [pinError, setPinError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("🦊");
  const [newPin, setNewPin] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("beginner");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("students")
        .select("id, name, avatar_emoji, difficulty, voice_character_id")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load students:", error);
        setFormError("Could not load students. Please try again.");
        return;
      }
      setStudents(data ?? []);
    } catch (err) {
      console.error("loadStudents error:", err);
      setFormError("Something went wrong loading students.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePinSubmit(pin: string) {
    if (!selectedStudent) return;
    setVerifying(true);
    setPinError("");

    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent.id, pin }),
      });
      const data = await res.json();

      if (data.verified && data.student) {
        setActiveStudent({
          id: data.student.id,
          name: data.student.name,
          avatar_emoji: data.student.avatar_emoji,
          difficulty: data.student.difficulty,
          voice_character_id: data.student.voice_character_id,
        });
        router.push("/");
      } else {
        setPinError("Wrong PIN, try again!");
      }
    } catch {
      setPinError("Could not verify PIN. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!/^\d{4}$/.test(newPin)) {
      setFormError("PIN must be exactly 4 digits.");
      return;
    }
    setAdding(true);
    setFormError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFormError("Not logged in.");
        setAdding(false);
        return;
      }

      const { error } = await supabase.from("students").insert({
        parent_id: user.id,
        name: newName.trim(),
        avatar_emoji: newAvatar,
        pin: newPin,
        difficulty: newDifficulty,
      });

      if (error) {
        setFormError(error.message || "Failed to add student.");
        setAdding(false);
        return;
      }

      setNewName("");
      setNewPin("");
      setShowAddForm(false);
      setAdding(false);
      await loadStudents();
    } catch {
      setFormError("Something went wrong. Please try again.");
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-pink-100 via-purple-50 to-green-100">
        <p className="text-purple-600 font-bold">Loading...</p>
      </div>
    );
  }

  // PIN entry screen
  if (selectedStudent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-pink-100 via-purple-50 to-green-100 p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-4"
        >
          {selectedStudent.avatar_emoji}
        </motion.div>

        <PinEntry
          studentName={selectedStudent.name}
          onSubmit={handlePinSubmit}
          error={pinError}
        />

        <button
          onClick={() => {
            setSelectedStudent(null);
            setPinError("");
          }}
          className="mt-6 text-sm font-bold text-purple-600 active:scale-95 transition-transform"
        >
          ← Back to students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-purple-50 to-green-100 p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-black text-purple-800">Who's Learning Today?</h1>
          <p className="text-sm text-purple-600">Tap your avatar to start</p>
        </motion.div>

        {/* Student cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {students.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelectedStudent(s)}
              className="bg-white rounded-2xl shadow-lg border-2 border-pink-200 p-4 flex flex-col items-center gap-2 active:border-pink-400 transition-colors"
            >
              <span className="text-5xl">{s.avatar_emoji}</span>
              <span className="font-black text-purple-800 text-sm">{s.name}</span>
              <span className="text-[10px] font-bold text-purple-500 capitalize bg-pink-50 px-2 py-0.5 rounded-full">
                {s.difficulty}
              </span>
            </motion.button>
          ))}

          {/* Add student button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: students.length * 0.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowAddForm(true)}
            className="bg-white/60 rounded-2xl border-2 border-dashed border-pink-300 p-4 flex flex-col items-center justify-center gap-2 active:bg-white/80 transition-colors min-h-[130px]"
          >
            <span className="text-3xl text-purple-400">+</span>
            <span className="font-bold text-purple-500 text-xs">Add Student</span>
          </motion.button>
        </div>

        {/* Add student form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 p-5">
                <h2 className="font-black text-purple-800 mb-4">Add New Student</h2>
                <form onSubmit={handleAddStudent} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-purple-700 mb-1 block">Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm"
                      placeholder="Student's name"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-purple-700 mb-2 block">Avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewAvatar(emoji)}
                          className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${
                            newAvatar === emoji
                              ? "bg-pink-100 border-2 border-pink-400 scale-110"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-purple-700 mb-1 block">
                      PIN (4 digits)
                    </label>
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm tracking-[0.5em] text-center font-mono"
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-purple-700 mb-2 block">Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "beginner" as const, label: "Beginner", emoji: "🐢" },
                        { value: "intermediate" as const, label: "Medium", emoji: "🐇" },
                        { value: "expert" as const, label: "Expert", emoji: "🚀" },
                      ]).map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setNewDifficulty(d.value)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                            newDifficulty === d.value
                              ? "bg-pink-100 border-2 border-pink-400 text-purple-800"
                              : "bg-gray-50 border border-gray-200 text-gray-500"
                          }`}
                        >
                          {d.emoji} {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setFormError(""); }}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adding}
                      className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {adding ? "Adding..." : "Add Student"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <div className="text-center mt-6 space-y-2">
          <button
            onClick={() => router.push("/parent/dashboard")}
            className="text-xs font-bold text-purple-600 block mx-auto"
          >
            Parent Dashboard →
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold text-gray-400 block mx-auto"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
