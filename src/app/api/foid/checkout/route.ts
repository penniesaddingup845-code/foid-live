import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
}

const PRODUCTS: Record<string, { name: string; description: string; price: number; interval: "month" }> = {
  "signal-starter": { name: "Signal Starter", description: "Daily intelligence brief", price: 9700, interval: "month" },
  "operator-desk": { name: "Operator Desk", description: "Multi-client pipeline", price: 29700, interval: "month" },
};

const N8N_BASE = "https://penniesaddingup845.app.n8n.cloud";
const N8N_KEY = process.env.N8N_API_KEY || "";
const INTAKE_WF = "CM1P9n5H9dGEogsQ";
const PIPELINE_WF = "N6DdbXko4SQ6g8N4";

async function triggerN8n(workflowId: string, data: Record<string, unknown>) {
  if (!N8N_KEY) return;
  try {
    await fetch(`${N8N_BASE}/api/v1/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  } catch (e) { console.error("n8n trigger failed:", e); }
}

async function savePilot(session: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "foid-pilots.json");
  let pilots: unknown[] = [];
  try { pilots = JSON.parse(await fs.readFile(file, "utf8")); } catch {}
  pilots.push({
    id: `pilot-${Date.now()}`,
    stripeSessionId: session.id,
    email: session.customer_details?.email || "",
    productId: session.metadata?.productId || "signal-starter",
    amount: session.amount_total || 9700,
    status: "active",
    createdAt: new Date().toISOString(),
  });
  await fs.writeFile(file, JSON.stringify(pilots, null, 2));
}

async function saveClientRecord(client: Record<string, unknown>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "foid-clients.json");
  let clients: unknown[] = [];
  try { clients = JSON.parse(await fs.readFile(file, "utf8")); } catch {}
  clients.push(client);
  await fs.writeFile(file, JSON.stringify(clients, null, 2));
}
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    if (process.env.FOID_CHECKOUT_ENABLED !== "true") {
      return NextResponse.json({ error: "FOID checkout pending approval" }, { status: 403 });
    }
    const product = PRODUCTS[productId];
    if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

    const session = await getStripe().checkout.sessions.create({
      customer_email: undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: product.name, description: product.description },
          unit_amount: product.price,
          recurring: { interval: product.interval },
        },
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `https://${process.env.FOID_DOMAIN || "localhost:3000"}/business/foid/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${process.env.FOID_DOMAIN || "localhost:3000"}/business/foid`,
      metadata: { productId, source: "command-palace" },
    });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 500 });
  }
}

// GET — Products or session verification
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (sessionId) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(sessionId);
      return NextResponse.json({ success: s.payment_status === "paid", status: s.payment_status });
    } catch { return NextResponse.json({ error: "Session not found" }, { status: 404 }); }
  }
  return NextResponse.json({ products: Object.entries(PRODUCTS).map(([id, p]) => ({ id, ...p, priceFormatted: `$${p.price / 100}` })) });
}

// PUT — Stripe webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    let event: any;
    try { event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"); }
    catch { event = JSON.parse(body) as any; }

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      console.log("✅ Payment:", s.id);
      await savePilot(s);
      await triggerN8n(INTAKE_WF, { email: s.customer_details?.email || "", action: "onboard" });
      await triggerN8n(PIPELINE_WF, { email: s.customer_details?.email || "", action: "onboard_new_client" });
      
      // Auto-create client record from Stripe session
      const email = s.customer_details?.email || "";
      const name = s.customer_details?.name || "New Client";
      if (email) {
        const client = {
          id: `foid-client-${Date.now()}`,
          client_name: name,
          email,
          company: s.metadata?.company || "",
          industry: s.metadata?.industry || "AI / Automation",
          tier: s.metadata?.productId === "operator-desk" ? "operator_desk" : "signal_starter",
          rss_feed_1: "https://techcrunch.com/category/artificial-intelligence/feed/",
          rss_feed_2: "https://www.saastr.com/feed/",
          rss_feed_3: "",
          rss_feed_4: "",
          rss_feed_5: "",
          focus_lanes: s.metadata?.focusLanes || "AI Infrastructure, GTM and Sales Tech",
          competitors: s.metadata?.competitors || "",
          goals: s.metadata?.goals || "Stay ahead of market shifts and convert signal into action.",
          delivery_frequency: s.metadata?.productId === "operator-desk" ? "daily" : "weekly",
          status: "pending_onboarding",
          stripe_customer_id: s.customer || "",
          stripe_session_id: s.id,
          n8nSyncStatus: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveClientRecord(client);
        console.log("✅ Client auto-created:", email);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
