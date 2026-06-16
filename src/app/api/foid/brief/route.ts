import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const DATA_DIR = "/Users/sire/.openclaw/workspace/command-palace/data";
const CLIENTS_FILE = path.join(DATA_DIR, "foid-clients.json");

type FoidClient = {
  id: string;
  client_name: string;
  email: string;
  company: string;
  tier: string;
  status: string;
};

async function getClients(): Promise<FoidClient[]> {
  try {
    const raw = await fs.readFile(CLIENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// GET /api/foid/brief?clientId=...&email=...&format=json|html|text
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || undefined;
    const email = searchParams.get("email") || undefined;

    const clients = await getClients();
    let client: FoidClient | null = null;

    if (clientId) client = clients.find((c) => c.id === clientId) || null;
    if (email) client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
    if (!client) client = clients.find((c) => c.status === "active") || null;

    if (!client) {
      return NextResponse.json({ error: "No active client found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      client: { name: client.client_name, email: client.email, tier: client.tier },
      note: "Use scripts/foid-send-brief.py to generate and send full brief",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
