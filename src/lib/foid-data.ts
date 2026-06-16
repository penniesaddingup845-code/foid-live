import fs from "node:fs/promises";
import path from "node:path";
import { runtimePaths } from "@/lib/runtime-paths";

const DATA_DIR = runtimePaths.dataDir;

export type FoidPilot = {
  id: string;
  stripeSessionId: string;
  stripeCustomerId: string;
  email: string;
  productId: string;
  productName: string;
  amount: number;
  status: "pending" | "active" | "paused" | "cancelled";
  n8nWorkflowId?: string;
  createdAt: string;
  updatedAt: string;
};

export type FoidProspect = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  vertical: string;
  source: string;
  status: "identified" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

async function readJSON<T>(filename: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, filename), "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJSON(filename: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf8");
}

// Pilots
export async function getPilots(): Promise<FoidPilot[]> {
  return readJSON<FoidPilot[]>("foid-pilots.json", []);
}

export async function createPilot(data: Omit<FoidPilot, "id" | "createdAt" | "updatedAt">): Promise<FoidPilot> {
  const pilots = await getPilots();
  const pilot: FoidPilot = {
    ...data,
    id: `pilot-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pilots.push(pilot);
  await writeJSON("foid-pilots.json", pilots);
  return pilot;
}

export async function updatePilot(id: string, patch: Partial<FoidPilot>): Promise<FoidPilot | null> {
  const pilots = await getPilots();
  const idx = pilots.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  pilots[idx] = { ...pilots[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeJSON("foid-pilots.json", pilots);
  return pilots[idx];
}

// Prospects
export async function getProspects(): Promise<FoidProspect[]> {
  return readJSON<FoidProspect[]>("foid-prospects.json", []);
}

export async function createProspect(data: Omit<FoidProspect, "id" | "createdAt" | "updatedAt">): Promise<FoidProspect> {
  const prospects = await getProspects();
  const prospect: FoidProspect = {
    ...data,
    id: `prospect-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  prospects.push(prospect);
  await writeJSON("foid-prospects.json", prospects);
  return prospect;
}

// Revenue tracking
export async function getRevenueStatus() {
  const pilots = await getPilots();
  const active = pilots.filter((p) => p.status === "active");
  const totalMRR = active.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    totalPilots: pilots.length,
    activePilots: active.length,
    totalMRR,
    totalMRRFormatted: `$${totalMRR / 100}/mo`,
    pilots: pilots.slice(-10).reverse(),
  };
}
