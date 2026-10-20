import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SECRET, ADMIN_EMAILS } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, email, token } = body;

    // Check by Master PIN
    if (pin && typeof pin === "string") {
      if (pin.trim() === ADMIN_SECRET) {
        return NextResponse.json({
          success: true,
          message: "Autenticación maestra concedida.",
          adminToken: ADMIN_SECRET,
          email: ADMIN_EMAILS[0],
          role: "SUPERADMIN",
        });
      }
      return NextResponse.json(
        { success: false, error: "Clave maestra o PIN incorrecto." },
        { status: 401 }
      );
    }

    // Check by Verified Email Session Token
    if (email && token) {
      const cleanEmail = email.trim().toLowerCase();
      if (!ADMIN_EMAILS.includes(cleanEmail)) {
        return NextResponse.json(
          { success: false, error: "Este correo no tiene permisos de administrador." },
          { status: 403 }
        );
      }

      const verification = await prisma.emailVerification.findFirst({
        where: {
          email: cleanEmail,
          token,
          verified: true,
        },
      });

      if (!verification) {
        return NextResponse.json(
          { success: false, error: "Sesión OTP no verificada o expirada." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Acceso de administrador verificado por correo.",
        adminToken: token,
        email: cleanEmail,
        role: "ADMIN_OWNER",
      });
    }

    return NextResponse.json(
      { success: false, error: "Debes ingresar el PIN maestro o verificar tu sesión de administrador." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/auth error:", err);
    return NextResponse.json(
      { success: false, error: "Error interno al autenticar administrador." },
      { status: 500 }
    );
  }
}
