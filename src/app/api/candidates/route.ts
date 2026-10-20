import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const TOTAL_FREE_SLOTS = 100;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "udec", "all"

    const whereClause: any = { status: "ACTIVE" };
    if (filter === "udec") {
      whereClause.isUdec = true;
    }

    const [candidates, totalCount] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          title: true,
          university: true,
          isUdec: true,
          isEarlyBird: true,
          yearsExp: true,
          specialties: true,
          preferredShift: true,
          preferredRegion: true,
          summary: true,
          linkedinUrl: true,
          phone: true,
          email: true,
          cvUrl: true,
          cvFileName: true,
          createdAt: true,
          // CRITICAL SECURITY FIX: managementToken is EXCLUDED from public API
        },
        orderBy: [
          { isUdec: "desc" }, // UdeC alumni always appear first with priority!
          { createdAt: "desc" },
        ],
        take: 60,
      }),
      prisma.candidate.count({ where: { status: "ACTIVE" } }),
    ]);

    const earlyBirdRemaining = Math.max(0, TOTAL_FREE_SLOTS - totalCount);

    return NextResponse.json({
      success: true,
      candidates,
      totalCount,
      totalSlots: TOTAL_FREE_SLOTS,
      earlyBirdRemaining,
    });
  } catch (err: any) {
    console.error("GET /api/candidates error:", err);
    return NextResponse.json(
      { success: false, error: "Error al cargar la bolsa de colegas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      title,
      university,
      isUdec,
      yearsExp,
      specialties,
      preferredShift,
      preferredRegion,
      summary,
      linkedinUrl,
      phone,
      email,
      cvUrl,
      cvFileName,
    } = body;

    if (!fullName || !title || !email || !summary) {
      return NextResponse.json(
        { success: false, error: "Completa tu Nombre, Cargo/Especialidad, Correo y Resumen profesional." },
        { status: 400 }
      );
    }

    // Current candidate count
    const totalCount = await prisma.candidate.count();
    const isEarlyBird = totalCount < TOTAL_FREE_SLOTS;

    // Validate UdeC status (Alumni privilege - regardless of email domain: gmail, hotmail, etc.)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUni = (university || "").trim();
    const finalIsUdec =
      Boolean(isUdec) ||
      normalizedEmail.endsWith("@udec.cl") ||
      normalizedEmail.endsWith("@alumnos.udec.cl") ||
      /concepci[oó]n|udec/i.test(normalizedUni) ||
      /concepci[oó]n|udec/i.test(title) ||
      /concepci[oó]n|udec/i.test(summary);

    // If slots are full and not UdeC, we can warn or flag (promotional rule)
    if (!isEarlyBird && !finalIsUdec) {
      // In early phase, we can still accept but flag as waitlist or standard
    }

    const managementToken = crypto.randomBytes(16).toString("hex");

    const candidate = await prisma.candidate.create({
      data: {
        fullName: fullName.trim(),
        title: title.trim(),
        university: finalIsUdec ? "Universidad de Concepción" : normalizedUni || "Otra Universidad",
        isUdec: finalIsUdec,
        isEarlyBird,
        yearsExp: parseInt(yearsExp || "1", 10),
        specialties: specialties?.trim() || "Geología General, Mapeo, QA/QC",
        preferredShift: preferredShift?.trim() || "7x7 o 4x3",
        preferredRegion: preferredRegion?.trim() || "Todo Chile",
        summary: summary.trim(),
        linkedinUrl: linkedinUrl?.trim() || null,
        phone: phone?.trim() || null,
        email: normalizedEmail,
        cvUrl: cvUrl?.trim() || null,
        cvFileName: cvFileName?.trim() || "CV_Geologia.pdf",
        status: "ACTIVE",
        managementToken,
      },
    });

    const managementUrl = `https://empleos.geologgia.cl/autogestion?token=${managementToken}`;

    return NextResponse.json({
      success: true,
      candidate,
      managementToken,
      managementUrl,
      isUdec: finalIsUdec,
      isEarlyBird,
      message: finalIsUdec
        ? "¡Perfil publicado con distinción Alumni Geología UdeC!"
        : "¡Perfil publicado con cupo gratuito Early Adopter!",
    });
  } catch (err: any) {
    console.error("POST /api/candidates error:", err);
    return NextResponse.json(
      { success: false, error: "Error al registrar el perfil." },
      { status: 500 }
    );
  }
}
