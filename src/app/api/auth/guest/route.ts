// Guest login: creates an ephemeral User (no Account row, no rating
// persistence) and signs it in via the Credentials provider.
//
// The guest user has a passwordHash set to a bcrypt of an internal secret.
// That secret is the one we pass to signIn("credentials") below, so the
// standard authorize() path (email + password) accepts it. The password is
// generated fresh on each call and discarded — there is no way to log in
// again as this guest later.
//
// Use case: play PvE or casual PvP without registering. Sessions expire
// after 1 day (jwt maxAge default), and rating is not updated for guest
// games (see games.finalizeRating).

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/server/auth";

export async function POST(req: NextRequest) {
  const name = (new URL(req.url).searchParams.get("name") || "Convidado").slice(0, 32);
  const initial = parseInt(process.env.INITIAL_RATING ?? "1200", 10);

  // Internal password: never persisted in cleartext and never reused.
  const internalPassword = randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(internalPassword, 10);

  // Use example.com (reserved by RFC 2606) so zod's .email() passes for
  // these ephemeral addresses — @local would be rejected.
  const email = `guest+${randomBytes(8).toString("hex")}@example.com`;
  const { prisma } = await import("@/lib/prisma");
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash, // set, so Credentials authorize() works
      isGuest: true, // marks this as ephemeral; finalizeRating skips rating
      rating: Number.isFinite(initial) ? initial : 1200,
      rd: 350,
      volatility: 0.06,
    },
  });

  // Sign in via the standard Credentials path. The authorize() callback
  // looks up by email and bcrypt.compare()s the password.
  try {
    await signIn("credentials", {
      email,
      password: internalPassword,
      redirectTo: "/lobby",
    });
    // signIn throws NEXT_REDIRECT on success; we never reach this line.
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Re-throw the redirect so Next.js can handle it; everything else is a
    // real error.
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return NextResponse.json({ error: "guest_login_failed" }, { status: 500 });
  }
}

// Allow the import above to be safely typed.
const _ = z; // keep zod in scope for parity with other auth routes