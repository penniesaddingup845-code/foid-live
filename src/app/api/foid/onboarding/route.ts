import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUEUE_FILE = path.join(DATA_DIR, "foid-n8n-sync-queue.json");

const N8N_BASE = process.env.N8N_API_URL || "https://penniesaddingup845.app.n8n.cloud";
const FOID_CLIENTS_TABLE_ID = "27HBFljVTow0f9Uf";

type FoidClient = {
  id: string;
  client_name: string;
  email: string;
  company: string;
  role: string;
  industry: string;
  tier: "signal_starter" | "operator_desk" | "war_room";
  rss_feed_1: string;
  rss_feed_2: string;
  rss_feed_3: string;
  rss_feed_4: string;
  rss_feed_5: string;
  focus_lanes: string;
  competitors: string;
  goals: string;
  delivery_frequency: "weekly" | "daily" | "realtime";
  status: "active" | "pending" | "paused" | "cancelled";
  stripe_customer_id: string;
  stripe_session_id: string;
  n8nSyncedAt?: string;
  n8nSyncStatus: "synced" | "queued" | "failed";
  created_at: string;
  updated_at: string;
};

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
}

function normalizeTier(value: unknown): FoidClient["tier"] {
  const tier = String(value || "signal_starter").toLowerCase().replace(/-/g, "_");
  if (tier === "operator_desk") return "operator_desk";
  if (tier === "war_room" || tier === "strategic_cell") return "war_room";
  return "signal_starter";
}

function deliveryFrequency(tier: FoidClient["tier"]): FoidClient["delivery_frequency"] {
  if (tier === "operator_desk") return "daily";
  if (tier === "war_room") return "realtime";
  return "weekly";
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function saveLocalClient(client: FoidClient) {
  const clients = await readJson<FoidClient[]>(path.join(DATA_DIR, "foid-clients.json"), []);
  const existingIndex = clients.findIndex(
    (c) => c.email.toLowerCase() === client.email.toLowerCase() || (client.stripe_session_id && c.stripe_session_id === client.stripe_session_id)
  );
  if (existingIndex >= 0) {
    clients[existingIndex] = { ...clients[existingIndex], ...client, id: clients[existingIndex].id, created_at: clients[existingIndex].created_at, updated_at: new Date().toISOString() };
  } else {
    clients.push(client);
  }
  await writeJson(path.join(DATA_DIR, "foid-clients.json"), clients);
}

function toN8nRow(client: FoidClient) {
  return {
    client_name: client.client_name,
    email: client.email,
    company: client.company,
    industry: client.industry,
    tier: client.tier,
    rss_feed_1: client.rss_feed_1,
    rss_feed_2: client.rss_feed_2,
    rss_feed_3: client.rss_feed_3,
    focus_lanes: client.focus_lanes,
    competitors: client.competitors,
    goals: client.goals,
    delivery_frequency: client.delivery_frequency,
    status: client.status,
    stripe_customer_id: client.stripe_customer_id,
    created_at: client.created_at,
  };
}

async function syncClientToN8n(client: FoidClient) {
  if (!process.env.N8N_API_KEY) {
    return { ok: false, reason: "Missing N8N_API_KEY" };
  }
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${FOID_CLIENTS_TABLE_ID}/rows`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-N8N-API-KEY": process.env.N8N_API_KEY },
    body: JSON.stringify({ data: [toN8nRow(client)] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, reason: `n8n ${res.status}: ${text.slice(0, 300)}` };
  }
  return { ok: true };
}

async function sessionContext(sessionId: string | null) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      email: session.customer_details?.email || (session as any).customer_email || "",
      name: session.customer_details?.name || "",
      productId: (session as any).metadata?.productId || "signal-starter",
      stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
      paymentStatus: session.payment_status,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const ctx = await sessionContext(sessionId);
  return NextResponse.json({ context: ctx });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = String(body.sessionId || body.session_id || "");
    const ctx = await sessionContext(sessionId);
    const tier = normalizeTier(body.tier || ctx?.productId);
    const now = new Date().toISOString();
    const email = String(body.email || ctx?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const client: FoidClient = {
      id: `foid-client-${Date.now()}`,
      client_name: String(body.client_name || body.clientName || ctx?.name || "New FOID Client").trim(),
      email,
      role: String(body.role || "").trim(),
      company: String(body.company || "").trim(),
      industry: String(body.industry || "AI / Automation").trim(),
      tier,
      rss_feed_1: String(body.rss_feed_1 || body.feed1 || "https://techcrunch.com/category/artificial-intelligence/feed/").trim(),
      rss_feed_2: String(body.rss_feed_2 || body.feed2 || "https://www.saastr.com/feed/").trim(),
      rss_feed_3: String(body.rss_feed_3 || body.feed3 || "").trim(),
      rss_feed_4: String(body.rss_feed_4 || body.feed4 || "").trim(),
      rss_feed_5: String(body.rss_feed_5 || body.feed5 || "").trim(),
      focus_lanes: Array.isArray(body.focus_lanes) ? body.focus_lanes.join(", ") : String(body.focus_lanes || body.focusLanes || "AI Infrastructure, GTM and Sales Tech").trim(),
      competitors: String(body.competitors || "").trim(),
      goals: String(body.goals || "Stay ahead of market shifts, spot useful automation opportunities, and convert signal into action.").trim(),
      delivery_frequency: deliveryFrequency(tier),
      status: "active",
      stripe_customer_id: String(body.stripe_customer_id || ctx?.stripeCustomerId || "").trim(),
      stripe_session_id: sessionId,
      n8nSyncStatus: "queued",
      created_at: now,
      updated_at: now,
    };

    const sync = await syncClientToN8n(client);
    if (sync.ok) {
      client.n8nSyncStatus = "synced";
      client.n8nSyncedAt = new Date().toISOString();
    } else {
      client.n8nSyncStatus = "failed";
      const queue = await readJson<Array<Record<string, unknown>>>(QUEUE_FILE, []);
      queue.push({ queuedAt: now, reason: sync.reason, client });
      await writeJson(QUEUE_FILE, queue);
    }

    await saveLocalClient(client);
    return NextResponse.json({ ok: true, client, n8n: sync });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Onboarding failed" }, { status: 500 });
  }
}
