"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/design");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="pt-[56px] min-h-screen flex items-center justify-center px-6 bg-grid bg-grid-fade"
      style={{ background: "var(--iron)" }}
    >
      <motion.div
        className="w-full max-w-[400px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div
          className="forge-card p-8"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--forge-orange)" }}
              />
              <span className="font-display text-[32px] tracking-wider" style={{ color: "var(--white)" }}>
                FORGE
              </span>
            </div>
          </div>

          <h1
            className="font-display text-heading text-center mb-8"
            style={{ color: "var(--white)" }}
          >
            Sign In
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="forge-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="forge-input"
            />

            {error && (
              <p className="text-mono" style={{ color: "#FF3B30", fontSize: 11 }}>
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="forge-btn-primary w-full mt-2"
              style={{
                height: 52,
                opacity: loading ? 0.5 : 1,
              }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
            >
              {loading ? "Signing In…" : "Sign In →"}
            </motion.button>
          </form>

          <p className="text-mono text-center mt-6" style={{ color: "var(--fog)", fontSize: 11 }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--forge-orange)" }}>
              Create One
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
