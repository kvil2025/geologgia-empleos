import { NextRequest } from "next/server";
import { prisma } from "./prisma";

// Default admin secret (can be overridden via ADMIN_SECRET_KEY in Vercel/.env)
export const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "geologgia2026!";

// Allowed administrator emails
export const ADMIN_EMAILS = [
  "cavila1971@gmail.com",
  "cavilacisternas@icloud.com",
  "contacto@geologgia.cl",
];

export async function verifyAdminRequest(req: NextRequest): Promise<{ authorized: boolean; email?: string; error?: string }> {
  const adminKey = req.headers.get("x-admin-key");
  const authHeader = req.headers.get("authorization");
  const token = adminKey || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

  if (!token) {
    return { authorized: false, error: "No se proporcionó token o clave de administración." };
  }

  // Option 1: Direct Master Key match
  if (token === ADMIN_SECRET) {
    return { authorized: true, email: ADMIN_EMAILS[0] };
  }

  // Option 2: Check if token is a valid verified EmailVerification session token belonging to an admin email
  try {
    const verification = await prisma.emailVerification.findFirst({
      where: {
        token,
        verified: true,
      },
    });

    if (verification && ADMIN_EMAILS.includes(verification.email.toLowerCase())) {
      return { authorized: true, email: verification.email };
    }
  } catch (err) {
    console.error("Error verifying admin token in DB:", err);
  }

  return { authorized: false, error: "Credenciales de administrador inválidas o no autorizadas." };
}
