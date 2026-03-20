"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { generateDesignWithUrl, createJob, getDesignDownload, type Design } from "@/lib/api";

const STLViewer = dynamic(() => import("@/components/STLViewer"), {
  ssr: false,
});

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const MATERIALS = ["PLA", "PETG", "ABS", "TPU"];
const COLORS = [
  { name: "White", hex: "#FAFAF8" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Gray", hex: "#888888" },
  { name: "Red", hex: "#CC2200" },
  { name: "Orange", hex: "#FF4D00" },
  { name: "Yellow", hex: "#DDAA00" },
  { name: "Green", hex: "#2D8A4E" },
  { name: "Blue", hex: "#2266AA" },
  { name: "Purple", hex: "#7744AA" },
  { name: "Pink", hex: "#CC3366" },
];

const STATUS_MESSAGES = [
  "Reading your description…",
  "Generating geometry…",
  "Compiling 3D model…",
  "Validating printability…",
];

export default function DesignPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [color, setColor] = useState("White");
  const [quantity, setQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [design, setDesign] = useState<Design | null>(null);
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || prompt.length < 10) return;
    setError("");
    setGenerating(true);
    setStatusIdx(0);

    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2000);

    try {
      const { design: result, stlUrl: url } = await generateDesignWithUrl(prompt);
      setDesign(result);
      setStlUrl(url);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Generation failed. Try a different description.";
      setError(msg);
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  }, [prompt]);

  const handleOrder = useCallback(async () => {
    if (!design) return;
    try {
      const job = await createJob(design.id, quantity, material, color);
      router.push(`/order/new?job=${job.id}`);
    } catch {
      setError("Failed to create order. Please try again.");
    }
  }, [design, quantity, material, color, router]);

  const canGenerate = prompt.trim().length >= 10 && !generating;

  return (
    <div className="pt-[56px] min-h-screen flex flex-col lg:flex-row">
      {/* Left — Input */}
      <div
        className="flex-1 lg:w-[55%] lg:max-w-[55%] p-8 lg:p-16 flex flex-col"
        style={{ background: "var(--iron)", borderRight: "1px solid var(--ash)" }}
      >
        {/* Breadcrumb */}
        <p className="text-mono mb-8" style={{ color: "var(--fog)" }}>
          Design / New
        </p>

        {/* Section label */}
        <p className="text-mono mb-3" style={{ color: "var(--forge-orange)" }}>
          Describe Your Object
        </p>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
            placeholder="A wall-mounted phone holder for iPhone 15 with a cable routing slot, fits standard wall screws"
            rows={6}
            className="forge-input resize-none"
            style={{
              fontSize: 16,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          />
          <span
            className="absolute bottom-3 right-3 text-mono"
            style={{ color: "var(--smoke)", fontSize: 10 }}
          >
            {prompt.length} / 500
          </span>
        </div>

        {/* Material */}
        <div className="mt-8">
          <p className="text-mono mb-3" style={{ color: "var(--fog)" }}>
            Material
          </p>
          <div className="flex gap-2 flex-wrap">
            {MATERIALS.map((m) => (
              <motion.button
                key={m}
                onClick={() => setMaterial(m)}
                className="text-mono cursor-pointer"
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius)",
                  background: material === m ? "var(--forge-orange)" : "var(--ash)",
                  color: material === m ? "var(--iron)" : "var(--light)",
                  border: material === m ? "none" : "1px solid var(--smoke)",
                  fontSize: 11,
                }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                {m}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="mt-6">
          <p className="text-mono mb-3" style={{ color: "var(--fog)" }}>
            Color
          </p>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map((c) => (
              <motion.button
                key={c.name}
                onClick={() => setColor(c.name)}
                className="w-8 h-8 cursor-pointer"
                style={{
                  background: c.hex,
                  borderRadius: "var(--radius-sm)",
                  border:
                    c.name === "White" || c.name === "Black"
                      ? "1px solid var(--smoke)"
                      : "none",
                  boxShadow:
                    color === c.name
                      ? `0 0 0 2px var(--iron), 0 0 0 3px var(--forge-orange)`
                      : "none",
                }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="mt-6">
          <p className="text-mono mb-3" style={{ color: "var(--fog)" }}>
            Quantity
          </p>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-body cursor-pointer"
              style={{
                borderRadius: "var(--radius)",
                background: "var(--ash)",
                border: "1px solid var(--smoke)",
                color: "var(--light)",
              }}
              whileTap={{ scale: 0.9 }}
              transition={spring}
            >
              −
            </motion.button>
            <span className="font-display text-[28px]" style={{ color: "var(--white)" }}>
              {quantity}
            </span>
            <motion.button
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              className="w-10 h-10 flex items-center justify-center text-body cursor-pointer"
              style={{
                borderRadius: "var(--radius)",
                background: "var(--ash)",
                border: "1px solid var(--smoke)",
                color: "var(--light)",
              }}
              whileTap={{ scale: 0.9 }}
              transition={spring}
            >
              +
            </motion.button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-4 text-body-sm"
              style={{ color: "#FF3B30" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Generate */}
        <motion.button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="forge-btn-primary mt-8 w-full"
          style={{
            height: 56,
            opacity: canGenerate ? 1 : 0.3,
            transition: "opacity 0.2s",
          }}
          whileTap={canGenerate ? { scale: 0.98 } : {}}
          transition={spring}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <motion.span
                className="w-4 h-4 border-2 rounded-full inline-block"
                style={{ borderColor: "rgba(17,17,17,0.3)", borderTopColor: "var(--iron)" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              Designing…
            </span>
          ) : (
            "Generate Design"
          )}
        </motion.button>
      </div>

      {/* Right — Preview */}
      <div
        className="flex-1 lg:w-[45%] lg:max-w-[45%] flex items-center justify-center p-8 lg:p-16 min-h-[50vh] lg:min-h-screen relative"
        style={{ background: "var(--steel)" }}
      >
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div
              key="generating"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Progress line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden"
                style={{ background: "var(--ash)" }}
              >
                <motion.div
                  className="h-full"
                  style={{ background: "linear-gradient(90deg, var(--forge-orange), var(--forge-amber))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 8, ease: "linear" }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIdx}
                  className="text-mono-lg"
                  style={{ color: "var(--fog)" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {STATUS_MESSAGES[statusIdx]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          ) : design && stlUrl ? (
            <motion.div
              key="preview"
              className="w-full h-full flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <STLViewer
                url={stlUrl}
                className="flex-1 min-h-[400px]"
              />

              <div className="forge-card mt-6 p-6">
                <p className="text-mono" style={{ color: "var(--fog)" }}>
                  {material} · {color} · Qty {quantity}
                </p>

                <div className="flex gap-3 mt-4">
                  <motion.button
                    onClick={handleOrder}
                    className="forge-btn-primary flex-1"
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    Order This
                  </motion.button>
                  <motion.button
                    className="forge-btn-secondary"
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    onClick={async () => {
                      if (!design) return;
                      try {
                        const dl = await getDesignDownload(design.id);
                        window.open(dl.download_url, "_blank");
                      } catch {
                        setError("Download failed.");
                      }
                    }}
                  >
                    Download STL
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                stroke="var(--smoke)"
                strokeWidth="0.5"
                opacity={0.5}
              >
                <rect x="12" y="20" width="40" height="32" rx="1" />
                <path d="M12 36L32 26L52 36" />
                <path d="M32 26V52" />
              </svg>
              <p className="text-mono" style={{ color: "var(--smoke)" }}>
                Your design will appear here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
