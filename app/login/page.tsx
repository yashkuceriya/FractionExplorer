"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/pick-student");
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
            Welcome Back
          </h1>
          <p className="text-sm text-purple-600 text-center mb-6">
            Parent / Guardian Login
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => router.push("/signup")}
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              Don't have an account? Sign up
            </button>
            <div>
              <button
                onClick={() => router.push("/")}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                or continue as guest
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
