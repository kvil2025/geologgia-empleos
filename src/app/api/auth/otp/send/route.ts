import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateEmailWithTypoCheck,
  generate6DigitOtp,
  generateSecureToken,
  sendOtpEmail,
} from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "Debes ingresar un correo electrónico válido." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const validation = validateEmailWithTypoCheck(email);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          suggestion: validation.suggestion,
        },
        { status: 400 }
      );
    }

    // Rate-limiting check: has a code been requested in the last 45 seconds?
    const recentRequest = await prisma.emailVerification.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 45 * 1000),
        },
      },
    });

    if (recentRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya enviamos un código recientemente. Por favor espera unos segundos antes de solicitar otro.",
        },
        { status: 429 }
      );
    }

    const code = generate6DigitOtp();
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unverified codes for this email
    await prisma.emailVerification.deleteMany({
      where: { email, verified: false },
    });

    // Save new verification request
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        token,
        expiresAt,
        verified: false,
      },
    });

    // Send email
    const emailRes = await sendOtpEmail(email, code);

    if (!emailRes.success) {
      return NextResponse.json(
        { success: false, error: emailRes.error || "No se pudo despachar el correo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: emailRes.isSimulated
        ? `Código generado con éxito: ${code} (Modo prueba: actívalo con este código)`
        : `Código de seguridad enviado a ${email}. Revisa tu bandeja de entrada o spam.`,
      email,
      token,
      isSimulated: emailRes.isSimulated,
      // Provide preview code if simulated so user is never blocked while testing
      previewCode: emailRes.isSimulated ? code : undefined,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/otp/send:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al generar código de seguridad." },
      { status: 500 }
    );
  }
}
