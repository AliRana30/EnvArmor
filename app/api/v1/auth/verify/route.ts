import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, email: auth.user.email });
}
