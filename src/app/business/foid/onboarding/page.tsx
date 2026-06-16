"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Context = {
  email?: string;
  name?: string;
  productId?: string;
  stripeCustomerId?: string;
  paymentStatus?: string;
} | null;

function tierFromProduct(productId?: string) {
  if (productId === "operator-desk") return "operator_desk";
  return "signal_starter";
}

function OnboardingInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const [context, setContext] = useState<Context>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultTier = useMemo(() => tierFromProduct(context?.productId), [context?.productId]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/foid/onboarding?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => setContext(d.context || null))
      .catch(() => setContext(null));
  }, [sessionId]);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      sessionId,
      client_name: String(formData.get("client_name") || ""),
      email: String(formData.get("email") || context?.email || ""),
      company: String(formData.get("company") || ""),
      industry: String(formData.get("industry") || ""),
      tier: String(formData.get("tier") || defaultTier),
      rss_feed_1: String(formData.get("rss_feed_1") || ""),
      rss_feed_2: String(formData.get("rss_feed_2") || ""),
      rss_feed_3: String(formData.get("rss_feed_3") || ""),
      focus_lanes: String(formData.get("focus_lanes") || ""),
      competitors: String(formData.get("competitors") || ""),
      goals: String(formData.get("goals") || ""),
    };

    const res = await fetch("/api/foid/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error || "Onboarding failed");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8">
          <div className="mb-3 text-xs uppercase tracking-[0.22em] text-emerald-200/80">Client activated</div>
          <h1 className="text-3xl font-bold text-stone-50">FOID is configured.</h1>
          <p className="mt-4 text-stone-300">
            Your intelligence desk is now active. The daily multi-client pipeline will pick this up from the FOID Clients table and begin generating briefs on your tier cadence.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-stone-400">
            <div className="font-medium text-stone-200">What happens next</div>
            <ul className="mt-2 space-y-2">
              <li>• Your client row is synced into n8n FOID Clients.</li>
              <li>• Signal Starter briefs run weekly; Operator Desk runs daily.</li>
              <li>• Briefs are generated as Cult OS HTML and delivered by Gmail from the n8n pipeline.</li>
            </ul>
          </div>
          <a href="/business/foid" className="mt-6 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm text-stone-200 hover:border-white/30">
            Back to FOID
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6">
        <div className="mb-2 text-xs uppercase tracking-[0.22em] text-amber-200/80">FOID onboarding</div>
        <h1 className="text-3xl font-bold text-stone-50">Configure your intelligence brief</h1>
        <p className="mt-3 text-sm text-stone-400">
          Payment is handled. This configures the sources, focus lanes, competitors, and outcomes that feed your FOID client brief pipeline.
        </p>
      </div>

      <form action={submit} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-300">
            Full name
            <input name="client_name" defaultValue={context?.name || ""} required className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            Email
            <input name="email" type="email" defaultValue={context?.email || ""} required className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            Company
            <input name="company" required className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            Industry
            <input name="industry" defaultValue="AI / Automation" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
          </label>
        </div>

        <label className="space-y-2 text-sm text-stone-300">
          Tier
          <select name="tier" defaultValue={defaultTier} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100">
            <option value="signal_starter">Signal Starter — weekly brief</option>
            <option value="operator_desk">Operator Desk — daily brief</option>
            <option value="war_room">Strategic Cell / War Room — realtime</option>
          </select>
        </label>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm font-medium text-stone-200">Feeds to watch</div>
          <div className="space-y-3">
            <input name="rss_feed_1" defaultValue="https://techcrunch.com/category/artificial-intelligence/feed/" placeholder="RSS feed 1" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
            <input name="rss_feed_2" defaultValue="https://www.saastr.com/feed/" placeholder="RSS feed 2" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
            <input name="rss_feed_3" placeholder="Optional RSS feed 3" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
          </div>
        </div>

        <label className="space-y-2 text-sm text-stone-300">
          Focus lanes
          <textarea name="focus_lanes" defaultValue="AI Infrastructure, GTM and Sales Tech, Competitive Intelligence" rows={3} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
        </label>

        <label className="space-y-2 text-sm text-stone-300">
          Competitors to monitor
          <textarea name="competitors" rows={3} placeholder="Example: Jasper, Copy.ai, Morning Brew, The Hustle" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
        </label>

        <label className="space-y-2 text-sm text-stone-300">
          Goals for your brief
          <textarea name="goals" rows={4} defaultValue="Stay ahead of market shifts, spot useful automation opportunities, and convert signal into action." className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100" />
        </label>

        {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <button disabled={loading} className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60">
          {loading ? "Activating..." : "Activate FOID client pipeline"}
        </button>
      </form>
    </div>
  );
}

export default function FoidOnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-400">Loading onboarding...</div>}>
      <OnboardingInner />
    </Suspense>
  );
}
