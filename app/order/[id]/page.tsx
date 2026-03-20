"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getJob, getJobStatus, type Job, type JobStatus } from "@/lib/api";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const STATES = [
  { key: "created", label: "Order Placed" },
  { key: "validating", label: "Validating Design" },
  { key: "validated", label: "Design Validated" },
  { key: "quoted", label: "Quote Ready" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "assigned", label: "Printing" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Delivered" },
];

const TERMINAL_STATES = new Set(["completed", "refunded"]);

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!id) return;
    try {
      const [j, s] = await Promise.all([getJob(id), getJobStatus(id)]);
      setJob(j);
      setStatus(s);
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load + 30s polling
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      // Stop polling if terminal
      if (job && TERMINAL_STATES.has(job.state)) return;
      fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStatus, job]);

  if (loading) {
    return (
      <div className="pt-[56px] min-h-screen flex items-center justify-center" style={{ background: "var(--iron)" }}>
        <motion.div
          className="w-6 h-6 border-2 rounded-full"
          style={{ borderColor: "var(--ash)", borderTopColor: "var(--forge-orange)" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="pt-[56px] min-h-screen flex items-center justify-center" style={{ background: "var(--iron)" }}>
        <p className="text-mono" style={{ color: "var(--fog)" }}>Order not found.</p>
      </div>
    );
  }

  const currentState = status?.current_state || job.state;
  const currentIdx = STATES.findIndex((s) => s.key === currentState);
  const completedStates = new Set(status?.history.map((h) => h.to_state) || []);

  // Handle refunded state
  if (currentState === "refunded") {
    return (
      <div className="pt-[56px] min-h-screen flex items-start justify-center px-6" style={{ background: "var(--iron)" }}>
        <div className="w-full max-w-[520px] py-16">
          <p className="text-mono mb-6" style={{ color: "var(--fog)" }}>
            Order #{id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="font-display text-display mb-4" style={{ color: "var(--white)" }}>
            Cancelled
          </h1>
          <p className="text-body" style={{ color: "var(--fog)" }}>
            This order has been cancelled and refunded.
          </p>
        </div>
      </div>
    );
  }

  const est = new Date();
  est.setDate(est.getDate() + 5);
  const estStr = est.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-[56px] min-h-screen flex items-start justify-center px-6" style={{ background: "var(--iron)" }}>
      <div className="w-full max-w-[520px] py-16">
        {/* Order ID */}
        <p className="text-mono mb-6" style={{ color: "var(--fog)" }}>
          Order #{id.slice(0, 8).toUpperCase()}
        </p>

        {/* Current state */}
        <motion.h1
          key={currentState}
          className="font-display text-display mb-12"
          style={{ color: "var(--white)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          {STATES[currentIdx]?.label || currentState}
        </motion.h1>

        {/* Timeline */}
        <div className="flex flex-col">
          {STATES.map((state, i) => {
            const isCompleted = completedStates.has(state.key) || i < currentIdx;
            const isCurrent = i === currentIdx;
            const isUpcoming = i > currentIdx;

            return (
              <motion.div
                key={state.key}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: i * 0.05 }}
              >
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderRadius: "var(--radius)",
                        background: isCompleted || isCurrent ? "var(--forge-orange)" : "var(--ash)",
                        border: isUpcoming ? "1px solid var(--smoke)" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7L6 10L11 4" stroke="var(--iron)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: isCurrent ? "var(--iron)" : "var(--smoke)" }}
                        />
                      )}
                    </div>
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--forge-orange)",
                          opacity: 0.4,
                        }}
                        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  {i < STATES.length - 1 && (
                    <div
                      className="w-[1px] h-6"
                      style={{ background: isCompleted ? "var(--forge-orange)" : "var(--ash)" }}
                    />
                  )}
                </div>

                <div className="pt-1.5">
                  <p
                    className="text-mono-lg"
                    style={{
                      color: isUpcoming ? "var(--smoke)" : isCurrent ? "var(--forge-orange)" : "var(--light)",
                    }}
                  >
                    {state.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tracking number */}
        {job.tracking_number && (
          <motion.div
            className="forge-card mt-8 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.25 }}
          >
            <p className="text-mono mb-2" style={{ color: "var(--fog)" }}>
              Tracking Number
            </p>
            <p className="text-mono-lg" style={{ color: "var(--white)" }}>
              {job.tracking_number}
            </p>
          </motion.div>
        )}

        {/* Estimated delivery */}
        <motion.div
          className="forge-card mt-6 p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          <p className="text-mono mb-2" style={{ color: "var(--fog)" }}>
            Estimated Delivery
          </p>
          <p className="font-display text-[28px]" style={{ color: "var(--white)" }}>
            {estStr}
          </p>
        </motion.div>

        {/* Price */}
        {job.customer_price && (
          <div
            className="mt-6 flex justify-between p-4"
            style={{ background: "var(--ash)", borderRadius: "var(--radius)", border: "1px solid var(--smoke)" }}
          >
            <span className="text-mono" style={{ color: "var(--fog)" }}>Total Paid</span>
            <span className="font-display text-[22px]" style={{ color: "var(--forge-orange)" }}>
              ${(job.customer_price * job.quantity).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
