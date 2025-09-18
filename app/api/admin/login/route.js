import { NextResponse } from "next/server";
import { initializeDatabase, sequelize } from "@/lib/sequelize";
import { QueryTypes } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function signSession(email) {
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  const hmac = crypto.createHmac("sha256", secret).update(email).digest("hex");
  return `${email}.${hmac}`;
}

export async function POST(request) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Query admin by email using raw SQL to avoid syncing models
    const rows = await sequelize.query(
      "SELECT username, email, password FROM admins WHERE lower(email) = :email LIMIT 1",
      {
        replacements: { email },
        type: QueryTypes.SELECT,
        logging: false,
      }
    );

    const admin = Array.isArray(rows) ? rows[0] : rows;

    if (!admin) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const passwordHash = admin.password;
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const session = signSession(admin.email);

    const res = NextResponse.json({ message: "Login berhasil" });
    res.cookies.set(COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

