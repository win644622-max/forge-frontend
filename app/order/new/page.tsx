"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getJob, createCheckout, type Job } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

// Load Stripe — use env var or test key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PK || "pk_test_placeholder"
);

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-16">
      {[1, 2, 3].map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className="w-8 h-8 flex items-center justify-center text-mono"
            style={{
              borderRadius: "var(--radius)",
              background: step <= current ? "var(--forge-orange)" : "var(--ash)",
              color: step <= current ? "var(--iron)" : "var(--fog)",
              border: step > current ? "1px solid var(--smoke)" : "none",
              transition: "all 0.3s",
            }}
          >
            {step < current ? "✓" : step}
          </div>
          {i < 2 && (
            <div
              className="w-12 h-[1px]"
              style={{
                background: step < current ? "var(--forge-orange)" : "var(--ash)",
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        className="w-6 h-6 border-2 rounded-full"
        style={{
          borderColor: "var(--ash)",
          borderTopColor: "var(--forge-orange)",
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />
    </div>
  );
}

// Stripe payment form component
function StripePaymentForm({
  job,
  total,
  onBack,
}: {
  job: Job;
  total: number;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setPayError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${job.id}`,
      },
    });

    if (error) {
      setPayError(error.message || "Payment failed.");
      setPaying(false);
    }
    // On success, Stripe redirects to return_url
  };

  return (
    <motion.div
      key="step3-stripe"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={spring}
    >
      <p className="text-mono mb-2" style={{ color: "var(--forge-orange)" }}>
        Step 03
      </p>
      <h2 className="font-display text-heading mb-8" style={{ color: "var(--white)" }}>
        Payment
      </h2>

      <form onSubmit={handlePay}>
        <div className="forge-card p-6 mb-6">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>

        <div
          className="flex justify-between p-4 mb-6"
          style={{
            background: "var(--ash)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--smoke)",
          }}
        >
          <span className="font-display text-[22px]" style={{ color: "var(--white)" }}>Total</span>
          <span className="font-display text-[22px]" style={{ color: "var(--forge-orange)" }}>
            ${total.toFixed(2)}
          </span>
        </div>

        {payError && (
          <p className="text-mono mb-4" style={{ color: "#FF3B30", fontSize: 11 }}>
            {payError}
          </p>
        )}

        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={onBack}
            className="forge-btn-secondary"
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            disabled={!stripe || paying}
            className="forge-btn-primary flex-1"
            style={{ height: 52, opacity: paying ? 0.5 : 1 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            {paying ? "Processing…" : "Place Order →"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

// Fallback payment form when Stripe isn't configured
function FallbackPaymentForm({
  job,
  total,
  onBack,
}: {
  job: Job;
  total: number;
  onBack: () => void;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const handleCheckout = async () => {
    setPaying(true);
    setPayError("");
    try {
      await createCheckout(job.id);
      router.push(`/order/${job.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed.";
      setPayError(msg);
      setPaying(false);
    }
  };

  return (
    <motion.div
      key="step3-fallback"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={spring}
    >
      <p className="text-mono mb-2" style={{ color: "var(--forge-orange)" }}>
        Step 03
      </p>
      <h2 className="font-display text-heading mb-8" style={{ color: "var(--white)" }}>
        Payment
      </h2>

      <div className="forge-card p-6 mb-6">
        <p className="text-body-sm mb-4" style={{ color: "var(--fog)" }}>
          Secure payment powered by Stripe
        </p>
        <div className="flex flex-col gap-4">
          <input type="text" placeholder="Card Number" className="forge-input" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="MM / YY" className="forge-input" />
            <input type="text" placeholder="CVC" className="forge-input" />
          </div>
        </div>
      </div>

      <div
        className="flex justify-between p-4 mb-6"
        style={{
          background: "var(--ash)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--smoke)",
        }}
      >
        <span className="font-display text-[22px]" style={{ color: "var(--white)" }}>Total</span>
        <span className="font-display text-[22px]" style={{ color: "var(--forge-orange)" }}>
          ${total.toFixed(2)}
        </span>
      </div>

      {payError && (
        <p className="text-mono mb-4" style={{ color: "#FF3B30", fontSize: 11 }}>
          {payError}
        </p>
      )}

      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          className="forge-btn-secondary"
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Back
        </motion.button>
        <motion.button
          onClick={handleCheckout}
          disabled={paying}
          className="forge-btn-primary flex-1"
          style={{ height: 52, opacity: paying ? 0.5 : 1 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          {paying ? "Processing…" : "Place Order →"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function OrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("job");

  const [step, setStep] = useState(1);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });

  // Fetch job and poll until it reaches a checkable state
  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const j = await getJob(jobId);
        if (!cancelled) {
          setJob(j);
          setLoading(false);

          // If still validating, poll again
          if (j.state === "created" || j.state === "validating") {
            setTimeout(poll, 3000);
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [jobId]);

  // When reaching step 3, create checkout to get client_secret
  const initCheckout = useCallback(async () => {
    if (!job) return;
    setError("");
    try {
      const checkout = await createCheckout(job.id);
      setClientSecret(checkout.client_secret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not initialize payment.";
      setError(msg);
    }
  }, [job]);

  const goToStep3 = useCallback(() => {
    setStep(3);
    initCheckout();
  }, [initCheckout]);

  if (loading) return <Spinner />;

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-mono" style={{ color: "var(--fog)" }}>Order not found.</p>
      </div>
    );
  }

  const subtotal = (job.customer_price || 25) * job.quantity;
  const shipping = 5.99;
  const total = subtotal + shipping;

  // Show waiting state if job is still validating
  if (job.state === "created" || job.state === "validating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <motion.div
          className="w-6 h-6 border-2 rounded-full"
          style={{ borderColor: "var(--ash)", borderTopColor: "var(--forge-orange)" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <p className="text-mono-lg" style={{ color: "var(--fog)" }}>
          Validating your design…
        </p>
        <p className="text-body-sm" style={{ color: "var(--smoke)" }}>
          This usually takes a few seconds.
        </p>
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={step} />

      {error && (
        <p className="text-mono mb-6" style={{ color: "#FF3B30", fontSize: 11 }}>
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={spring}
          >
            <p className="text-mono mb-2" style={{ color: "var(--forge-orange)" }}>
              Step 01
            </p>
            <h2 className="font-display text-heading mb-8" style={{ color: "var(--white)" }}>
              Confirm Your Design
            </h2>

            <div className="forge-card p-6 mb-6">
              {[
                ["Material", job.material],
                ["Color", job.color],
                ["Quantity", String(job.quantity)],
                ["Status", job.state.charAt(0).toUpperCase() + job.state.slice(1)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-3" style={{ borderBottom: "1px solid var(--ash)" }}>
                  <span className="text-mono" style={{ color: "var(--fog)" }}>{label}</span>
                  <span className="text-body-sm font-medium" style={{ color: "var(--white)" }}>{value}</span>
                </div>
              ))}

              <div className="mt-4 pt-4">
                {[
                  ["Subtotal", `$${subtotal.toFixed(2)}`],
                  ["Shipping", `$${shipping.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2">
                    <span className="text-mono" style={{ color: "var(--fog)" }}>{label}</span>
                    <span className="text-body-sm" style={{ color: "var(--light)" }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-4 mt-2" style={{ borderTop: "1px solid var(--ash)" }}>
                  <span className="font-display text-[22px]" style={{ color: "var(--white)" }}>Total</span>
                  <span className="font-display text-[22px]" style={{ color: "var(--forge-orange)" }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              onClick={() => setStep(2)}
              className="forge-btn-primary w-full"
              style={{ height: 52 }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={spring}
          >
            <p className="text-mono mb-2" style={{ color: "var(--forge-orange)" }}>
              Step 02
            </p>
            <h2 className="font-display text-heading mb-8" style={{ color: "var(--white)" }}>
              Shipping Address
            </h2>

            <div className="flex flex-col gap-4">
              {[
                { key: "name", label: "Full Name" },
                { key: "line1", label: "Address" },
                { key: "line2", label: "Apt, Suite (Optional)" },
                { key: "city", label: "City" },
              ].map(({ key, label }) => (
                <input
                  key={key}
                  type="text"
                  value={address[key as keyof typeof address]}
                  onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                  placeholder={label}
                  className="forge-input"
                />
              ))}

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State"
                  className="forge-input"
                />
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  placeholder="ZIP Code"
                  className="forge-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <motion.button
                onClick={() => setStep(1)}
                className="forge-btn-secondary"
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                Back
              </motion.button>
              <motion.button
                onClick={goToStep3}
                className="forge-btn-primary flex-1"
                style={{ height: 52 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#FF4D00",
                    colorBackground: "#2A2A2A",
                    colorText: "#F0EDE8",
                    colorTextSecondary: "#888888",
                    borderRadius: "4px",
                    fontFamily: '"DM Sans", sans-serif',
                  },
                },
              }}
            >
              <StripePaymentForm job={job} total={total} onBack={() => setStep(2)} />
            </Elements>
          ) : (
            <FallbackPaymentForm job={job} total={total} onBack={() => setStep(2)} />
          )
        )}
      </AnimatePresence>
    </>
  );
}

export default function OrderNewPage() {
  return (
    <div
      className="pt-[56px] min-h-screen flex items-start justify-center px-6"
      style={{ background: "var(--iron)" }}
    >
      <div className="w-full max-w-[520px] py-16">
        <Suspense fallback={<Spinner />}>
          <OrderContent />
        </Suspense>
      </div>
    </div>
  );
}
