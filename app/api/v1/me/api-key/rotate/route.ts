import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  const newApiKey = randomBytes(16).toString("hex");
  await prisma.user.update({
    where: { email: authUser.email },
    data: { apiKey: newApiKey }
  });

  return NextResponse.json({ apiKey: newApiKey });
}
