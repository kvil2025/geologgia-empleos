import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email;
    const rawCode = body.code;

    if (!rawEmail || !rawCode) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar tu correo y el código de 6 dígitos." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const code = rawCode.trim().replace(/\D/g, ""); // digits only

    if (code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "El código debe contener exactamente 6 números." },
        { status: 400 }
      );
    }

    // Find the latest pending verification for this email
    const record = await prisma.emailVerification.findFirst({
      where: {
        email,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "No hay un código pendiente para este correo. Solicita uno nuevo." },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { success: false, error: "El código expiró (validez de 10 min). Solicita uno nuevo." },
        { status: 400 }
      );
    }

    // Check brute-force attempts
    if (record.attempts >= 5) {
      await prisma.emailVerification.delete({ where: { id: record.id } });
      return NextResponse.json(
        { success: false, error: "Superaste el límite de intentos permitidos. Solicita un nuevo código." },
        { status: 429 }
      );
    }

    // Check match
    if (record.code !== code) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = 4 - record.attempts;
      return NextResponse.json(
        {
          success: false,
          error: `Código incorrecto. ${remaining > 0 ? `Te quedan ${remaining} intentos.` : "Código bloqueado por seguridad."}`,
        },
        { status: 400 }
      );
    }

    // Valid code: mark verified
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Check if user already has a candidate profile registered
    const existingCandidate = await prisma.candidate.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      message: "¡Correo electrónico verificado con éxito!",
      verifiedEmail: email,
      token: record.token,
      candidate: existingCandidate || null,
      managementToken: existingCandidate?.managementToken || null,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/otp/verify:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al verificar código." },
      { status: 500 }
    );
  }
}
