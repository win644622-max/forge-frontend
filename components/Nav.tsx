"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 h-[56px] flex items-center px-8 md:px-12"
      style={{
        background: scrolled
          ? "rgba(17, 17, 17, 0.92)"
          : "rgba(17, 17, 17, 0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--ash)",
        transition: "background 0.3s",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--forge-orange)" }}
        />
        <span
          className="font-display text-[28px] tracking-wider"
          style={{ color: "var(--white)" }}
        >
          FORGE
        </span>
      </Link>

      {/* Right */}
      <div className="ml-auto flex items-center gap-6">
        {isAuthenticated ? (
          <>
            <span className="text-mono" style={{ color: "var(--fog)" }}>
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-mono cursor-pointer transition-colors duration-200"
              style={{ color: "var(--fog)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--forge-orange)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--fog)")
              }
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="forge-btn-primary"
            style={{ padding: "10px 24px", fontSize: "10px" }}
          >
            Sign In
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
