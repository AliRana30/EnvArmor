import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { UserPlan } from "@prisma/client";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: UserPlan;
  apiKey: string;
};

export type ApiAuthResult = {
  user: ApiUser;
  source: "bearer" | "session";
} | null;

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function getApiUser(request: Request): Promise<ApiAuthResult> {
  const bearerToken = extractBearerToken(request.headers.get("authorization"));

  if (bearerToken) {
    const user = await prisma.user.findUnique({
      where: { apiKey: bearerToken },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        apiKey: true
      }
    });

    if (user) {
      return { user, source: "bearer" };
    }
  }

  let authUser = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data.user;
  } catch (err) {
    console.error("Supabase auth error in getApiUser:", err);
  }

  if (!authUser?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      apiKey: true
    }
  });

  return user ? { user, source: "session" } : null;
}
