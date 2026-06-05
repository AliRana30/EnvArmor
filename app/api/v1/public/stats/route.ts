import { NextResponse } from "next/server";
import { getPublicSiteStats } from "@/lib/site-data";

export const revalidate = 300;

export async function GET() {
  return NextResponse.json(await getPublicSiteStats());
}
