import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // 1. Declare in the outer scope
    let supabase;
    
    try {
      // 2. Initialize inside the try block (matching your preferred placement)
      supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } catch (err: any) {
      console.error("❌ Auth Callback Error (Code Exchange):", err.message);
      // In development, if we fail to exchange code (usually due to unreachable Supabase),
      // we still want to allow the user to see the dashboard.
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.redirect(new URL("/dashboard?error=dev_bypass", requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", requestUrl.origin));
    }

    // 3. This can now access supabase perfectly without any 'Cannot find name supabase' errors!
    const {
      data: { user: authUser },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !authUser?.email) {
      console.error("❌ Auth Callback Error (GetUser):", userError?.message || "No email found");
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.redirect(new URL("/dashboard?error=dev_bypass", requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", requestUrl.origin));
    }

    try {
      const fullName =
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name ??
        authUser.email.split("@")[0];

      const existingUser = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT u."id"
        FROM "User" u
        WHERE u."email" = ${authUser.email}
        LIMIT 1
      `;

      let dbUserId = existingUser[0]?.id ?? null;

      if (dbUserId) {
        await prisma.$executeRaw`
          UPDATE "User"
          SET "name" = ${fullName},
              "avatarUrl" = ${authUser.user_metadata?.avatar_url ?? null},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${dbUserId}
        `;
      } else {
        const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
          INSERT INTO "User" ("email", "name", "avatarUrl", "apiKey")
          VALUES (${authUser.email}, ${fullName}, ${authUser.user_metadata?.avatar_url ?? null}, ${randomBytes(16).toString("hex")})
          RETURNING "id"
        `;

        dbUserId = inserted[0]?.id ?? null;
      }

      if (!dbUserId) {
        throw new Error("Could not create/find user in database");
      }

      const existingProjects = await prisma.project.count({
        where: { userId: dbUserId }
      });

      if (existingProjects === 0) {
        const projectName = "My First Project";
        await prisma.project.create({
          data: {
            userId: dbUserId,
            name: projectName,
            slug: slugify(projectName),
            description: "Default project created during first login"
          }
        });
      }
    } catch (dbErr: any) {
      console.error("❌ Auth Callback DB Error:", dbErr.message);
      // Even if DB update fails, the session is already in cookies, so we can redirect to dashboard
    }

    const next = requestUrl.searchParams.get("next") ?? "/dashboard";
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/login?error=no_code_provided", requestUrl.origin));
}
