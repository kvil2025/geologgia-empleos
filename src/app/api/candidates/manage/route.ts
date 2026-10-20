import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token requerido" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { managementToken: token },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, status, preferredShift, preferredRegion, summary, phone, email } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: "Token requerido" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { managementToken: token },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Perfil no encontrado" }, { status: 404 });
    }

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        ...(status && { status }),
        ...(preferredShift && { preferredShift }),
        ...(preferredRegion && { preferredRegion }),
        ...(summary && { summary }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    });

    return NextResponse.json({
      success: true,
      candidate: updated,
      message: status === "PAUSED" ? "Tu perfil ha sido pausado. Ya no aparecerá en las búsquedas." : "Tu perfil ha sido actualizado exitosamente.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Error al actualizar perfil" }, { status: 500 });
  }
}

// DERECHO AL OLVIDO / SUPRESIÓN DEFINITIVA (Ley N° 19.628 y Nueva Ley de Protección de Datos de Chile)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryToken = searchParams.get("token");
    let token = queryToken;

    if (!token) {
      try {
        const body = await req.json();
        token = body.token;
      } catch {
        // no json body
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de autorización requerido para eliminar perfil." },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { managementToken: token },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Perfil no encontrado o token revocado." },
        { status: 404 }
      );
    }

    // Permanently remove candidate and associated CV data
    await prisma.candidate.delete({
      where: { id: candidate.id },
    });

    return NextResponse.json({
      success: true,
      message: "Tu perfil, datos personales y currículum han sido eliminados definitivamente de la plataforma (Derecho al Olvido ejercido con éxito).",
    });
  } catch (err: any) {
    console.error("DELETE /api/candidates/manage error:", err);
    return NextResponse.json(
      { success: false, error: "Error al procesar la supresión de datos." },
      { status: 500 }
    );
  }
}
