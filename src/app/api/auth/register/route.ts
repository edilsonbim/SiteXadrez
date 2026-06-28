// Register a new local account with email + password.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  name: z.string().min(1).max(32),
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const initial = parseInt(process.env.INITIAL_RATING ?? "1200", 10);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      isGuest: false,
      rating: Number.isFinite(initial) ? initial : 1200,
      rd: 350,
      volatility: 0.06,
    },
  });

  return NextResponse.json({ ok: true });
}