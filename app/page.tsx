"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

function Step({
  number,
  title,
  body,
  delay,
}: {
  number: string;
  title: string;
  body: string;
  delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="forge-card p-8"
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay }}
    >
      <span
        className="font-display text-[48px] leading-none"
        style={{ color: "var(--forge-orange)" }}
      >
        {number}
      </span>
      <h3
        className="font-display text-[28px] mt-4 tracking-wider"
        style={{ color: "var(--white)" }}
      >
        {title}
      </h3>
      <p
        className="text-body-sm mt-3"
        style={{ color: "var(--fog)" }}
      >
        {body}
      </p>
    </motion.div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-6">
      <span
        className="font-display text-[48px] leading-none"
        style={{ color: "var(--forge-orange)" }}
      >
        {value}
      </span>
      <span className="text-mono" style={{ color: "var(--fog)" }}>
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative bg-grid bg-grid-fade bg-glow-orange">
        <motion.p
          className="text-mono-lg mb-6"
          style={{ color: "var(--forge-orange)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          Domestic AI Manufacturing
        </motion.p>

        <motion.h1
          className="text-hero text-center"
          style={{ color: "var(--white)" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
        >
          Make anything
          <br />
          <span style={{ color: "var(--forge-orange)" }}>real.</span>
        </motion.h1>

        <motion.p
          className="text-body mt-8 text-center max-w-[440px]"
          style={{ color: "var(--fog)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          Describe it. We design it. A maker prints and ships it to your door.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.45 }}
          className="mt-10"
        >
          <Link href="/design">
            <motion.button
              className="forge-btn-primary cursor-pointer"
              whileTap={{ scale: 0.97 }}
              transition={spring}
            >
              Start Designing →
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          <motion.div
            className="w-[1px] h-8"
            style={{ background: "var(--smoke)" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* Stats bar */}
      <section style={{ background: "var(--steel)", borderTop: "1px solid var(--ash)", borderBottom: "1px solid var(--ash)" }}>
        <div className="max-w-[960px] mx-auto flex flex-wrap justify-center divide-x" style={{ borderColor: "var(--ash)" }}>
          <StatCell value="<5" label="Day Delivery" />
          <StatCell value="100%" label="Domestic" />
          <StatCell value="AI" label="Designed" />
          <StatCell value="∞" label="Possibilities" />
        </div>
      </section>

      {/* Three Steps */}
      <section
        className="py-24 md:py-32 px-6 md:px-12"
        style={{ background: "var(--iron)" }}
      >
        <div className="max-w-[960px] mx-auto">
          <motion.p
            className="text-mono-lg mb-4"
            style={{ color: "var(--forge-orange)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.p>
          <motion.h2
            className="text-display mb-16"
            style={{ color: "var(--white)" }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring}
          >
            Three steps.
            <br />
            Zero CAD skills.
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step
              number="01"
              title="Describe It"
              body="Tell us what you want in plain language. No design skills needed."
              delay={0}
            />
            <Step
              number="02"
              title="We Design It"
              body="AI generates a printable 3D file in seconds. Review and refine."
              delay={0.1}
            />
            <Step
              number="03"
              title="It Ships"
              body="A domestic maker prints and ships it to your door. Fast. Real."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 md:py-32 px-6 text-center bg-grid bg-grid-fade"
        style={{ background: "var(--steel)" }}
      >
        <motion.h2
          className="text-display mb-6"
          style={{ color: "var(--white)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={spring}
        >
          Ready to build?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <Link href="/design">
            <motion.button
              className="forge-btn-primary cursor-pointer"
              whileTap={{ scale: 0.97 }}
              transition={spring}
            >
              Start Your First Design →
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          background: "var(--iron)",
          borderTop: "1px solid var(--ash)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--forge-orange)" }}
          />
          <span className="font-display text-[20px] tracking-wider" style={{ color: "var(--fog)" }}>
            FORGE
          </span>
        </div>
        <p className="text-mono" style={{ color: "var(--smoke)" }}>
          © 2026 Forge. Domestic AI Manufacturing.
        </p>
      </footer>
    </div>
  );
}
