"use client";

import { useState } from "react";
import Link from "next/link";

export default function FoidProductPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(productId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/foid/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0F1629 50%, #1C1C2E 100%)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full" style={{ background: "#D4AF37", filter: "blur(120px)" }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full" style={{ background: "#5B8DEF", filter: "blur(150px)" }} />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest" style={{ border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.08)", color: "#D4AF37" }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34C759" }} />
            Early Bird Pricing — Limited Time
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight" style={{ color: "#F5F5F7", lineHeight: 1.05 }}>
            FOID
          </h1>
          <p className="mt-2 text-xl md:text-2xl font-medium tracking-wide" style={{ color: "#D4AF37" }}>
            First On It Daily
          </p>
          <p className="mt-6 max-w-2xl text-lg" style={{ color: "#8E8E93", lineHeight: 1.7 }}>
            Stop scanning. Start commanding. Get a daily intelligence brief that tells you what changed,
            why it matters, and what to do next — delivered to your inbox every morning.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => handleCheckout("signal-starter")}
              disabled={loading}
              className="rounded-lg px-8 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)", color: "#0A0A0F" }}
            >
              {loading ? "Processing..." : "Start Signal Starter — $97/mo"}
            </button>
            <button
              onClick={() => handleCheckout("operator-desk")}
              disabled={loading}
              className="rounded-lg px-8 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", background: "transparent" }}
            >
              Start Operator Desk — $297/mo
            </button>
          </div>
          {error && <p className="mt-4 text-sm" style={{ color: "#FF4D4F" }}>{error}</p>}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Signal Starter */}
          <div className="rounded-2xl p-8" style={{ background: "#1C1C2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: "#F5F5F7" }}>Signal Starter</h3>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37" }}>Early Bird</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold" style={{ color: "#F5F5F7" }}>$97</span>
              <span style={{ color: "#8E8E93" }}>/mo</span>
              <p className="mt-1 text-sm line-through" style={{ color: "#8E8E93" }}>$597/mo regular</p>
            </div>
            <ul className="space-y-3 mb-8">
              {["3 briefs per week", "15 sources monitored", "Weekly decision memo", "Email + PDF delivery", "1 focus lane"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#8E8E93" }}>
                  <span style={{ color: "#34C759" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout("signal-starter")}
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)", color: "#0A0A0F" }}
            >
              Get Signal Starter
            </button>
          </div>

          {/* Operator Desk */}
          <div className="rounded-2xl p-8 relative" style={{ background: "#1C1C2E", border: "1px solid rgba(212,175,55,0.3)" }}>
            <div className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#D4AF37", color: "#0A0A0F" }}>
              Most Popular
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: "#F5F5F7" }}>Operator Desk</h3>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37" }}>Early Bird</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold" style={{ color: "#F5F5F7" }}>$297</span>
              <span style={{ color: "#8E8E93" }}>/mo</span>
              <p className="mt-1 text-sm line-through" style={{ color: "#8E8E93" }}>$1,997/mo regular</p>
            </div>
            <ul className="space-y-3 mb-8">
              {["Daily briefs", "40 sources monitored", "Competitive intelligence", "Email + PDF delivery", "3 focus lanes", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#8E8E93" }}>
                  <span style={{ color: "#34C759" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout("operator-desk")}
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)", color: "#0A0A0F" }}
            >
              Get Operator Desk
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "#F5F5F7" }}>How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Configure", desc: "Set your focus lanes, competitors, and preferred feeds. We monitor what matters to YOUR business." },
            { step: "02", title: "Analyze", desc: "Our AI reads 20+ sources daily, deduplicates signals, and identifies what changed in your market." },
            { step: "03", title: "Deliver", desc: "Get a curated brief with what changed, why it matters, and what to do next. Email + PDF." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl p-6" style={{ background: "#1C1C2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-3xl font-bold" style={{ color: "#D4AF37" }}>{item.step}</span>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "#F5F5F7" }}>{item.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "#8E8E93", lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "#F5F5F7" }}>Questions</h2>
        <div className="space-y-6">
          {[
            { q: "Why is this so much cheaper than standard pricing?", a: "You're getting in early. This is our beta pricing for founding customers. When we launch publicly, prices go to $597/$1,997/$4,500." },
            { q: "What happens when early bird ends?", a: "You lock in your early bird rate for as long as you stay subscribed. No price increases for existing customers." },
            { q: "Can I cancel anytime?", a: "Yes. No contracts. Cancel from your account page or email help@getfoid.com." },
            { q: "How is this different from a newsletter?", a: "Newsletters are generic. FOID is tailored to YOUR business — your competitors, your lanes, your market. It's intelligence, not content." },
          ].map((item) => (
            <div key={item.q} className="rounded-xl p-6" style={{ background: "#1C1C2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="font-semibold" style={{ color: "#F5F5F7" }}>{item.q}</h3>
              <p className="mt-2 text-sm" style={{ color: "#8E8E93", lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span style={{ color: "#D4AF37" }}>◆</span>
            <span className="font-semibold" style={{ color: "#F5F5F7" }}>FOID</span>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: "#8E8E93" }}>
            <Link href="/business/foid/customers" className="hover:opacity-80">Customers</Link>
            <Link href="/business/foid/import" className="hover:opacity-80">Import Leads</Link>
            <Link href="/business/foid/deploy-checklist" className="hover:opacity-80">Deploy</Link>
            <Link href="/privacy" className="hover:opacity-80">Privacy</Link>
            <Link href="/terms" className="hover:opacity-80">Terms</Link>
            <a href="mailto:help@getfoid.com" className="hover:opacity-80">help@getfoid.com</a>
            <a href="mailto:sales@getfoid.com" className="hover:opacity-80">sales@getfoid.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
