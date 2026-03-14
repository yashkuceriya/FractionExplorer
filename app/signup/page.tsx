"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-pink-100 via-purple-50 to-green-100 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-emerald-200 p-8 text-center max-w-sm"
        >
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-xl font-black text-emerald-700 mb-2">Account Created!</h2>
          <p className="text-sm text-gray-600">
            Check your email to confirm, then add your students.
          </p>
          <button
            onClick={() => router.push("/pick-student")}
            className="mt-4 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-pink-100 via-purple-50 to-green-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl shadow-xl border-2 border-pink-200 p-6">
          <h1 className="text-2xl font-black text-purple-800 text-center mb-1">
            Create Account
          </h1>
          <p className="text-sm text-purple-600 text-center mb-6">
            Parent / Guardian Registration
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-purple-700 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm bg-pink-50/50"
                placeholder="parent@email.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-purple-700 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm bg-pink-50/50"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-purple-700 mb-1 block">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm bg-pink-50/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 text-sm"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
