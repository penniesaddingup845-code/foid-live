import { NextResponse } from "next/server";
import { getRevenueStatus } from "@/lib/foid-data";

export async function GET() {
  try {
    return NextResponse.json(await getRevenueStatus());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load FOID revenue status" },
      { status: 500 },
    );
  }
}
