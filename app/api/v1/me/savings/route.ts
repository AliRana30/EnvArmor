import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { calculateTotalSavings } from "@/lib/savings-engine";

export async function GET(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await calculateTotalSavings(auth.user.id);
  return NextResponse.json(summary);
}
