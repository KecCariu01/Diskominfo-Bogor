import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function verifySession(session) {
  if (!session) return null;
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  const lastDot = session.lastIndexOf(".");
  if (lastDot === -1) return null;
  const email = session.slice(0, lastDot);
  const sig = session.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { email };
  }
  return null;
}

export async function GET(request) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const payload = verifySession(cookie);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email: payload.email });
}

