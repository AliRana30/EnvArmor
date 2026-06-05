import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLegacyUserByEmail } from "@/lib/legacy-user";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getLegacyUserByEmail(authUser.email);

  return NextResponse.json({ user });
}
