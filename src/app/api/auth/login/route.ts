// Login with email/password via the Credentials provider. After successful
// auth, the signIn callback in src/server/auth.ts inserts the Session row
// and sets the authjs.session-token cookie; this endpoint simply chains a
// redirect to /lobby.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/server/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/lobby",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Auth.js v5 throws a redirect error on success — only treat real auth
    // failures as 401.
    if (
      e?.type === "CredentialsSignin" ||
      e?.code === "credentials" ||
      e?.name === "CredentialsSignin"
    ) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    throw e;
  }
}