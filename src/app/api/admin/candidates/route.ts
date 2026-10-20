import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const statusFilter = searchParams.get("status"); // "ACTIVE", "PAUSED", "all"
    const udecFilter = searchParams.get("udec"); // "true", "all"

    const where: any = {};
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }
    if (udecFilter === "true") {
      where.isUdec = true;
    }
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { university: { contains: q, mode: "insensitive" } },
        { specialties: { contains: q, mode: "insensitive" } },
      ];
    }

    const [candidates, totalCount, activeCount, pausedCount, udecCount] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.candidate.count(),
      prisma.candidate.count({ where: { status: "ACTIVE" } }),
      prisma.candidate.count({ where: { status: "PAUSED" } }),
      prisma.candidate.count({ where: { isUdec: true } }),
    ]);

    const earlyBirdRemaining = Math.max(0, 100 - activeCount);

    return NextResponse.json({
      success: true,
      candidates,
      stats: {
        total: totalCount,
        active: activeCount,
        paused: pausedCount,
        udec: udecCount,
        earlyBirdRemaining,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/candidates error:", err);
    return NextResponse.json(
      { success: false, error: "Error al cargar postulantes para administración." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, isUdec, isEarlyBird, yearsExp, preferredShift, preferredRegion } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de candidato requerido." },
        { status: 400 }
      );
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(isUdec !== undefined && { isUdec: Boolean(isUdec) }),
        ...(isEarlyBird !== undefined && { isEarlyBird: Boolean(isEarlyBird) }),
        ...(yearsExp !== undefined && { yearsExp: parseInt(yearsExp, 10) }),
        ...(preferredShift !== undefined && { preferredShift }),
        ...(preferredRegion !== undefined && { preferredRegion }),
      },
    });

    return NextResponse.json({
      success: true,
      candidate: updated,
      message: `Candidato ${updated.fullName} actualizado correctamente a estado [${updated.status}].`,
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/candidates error:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar candidato." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    let id = queryId;

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no json body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de candidato requerido para eliminar." },
        { status: 400 }
      );
    }

    const deleted = await prisma.candidate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `El perfil y CV de ${deleted.fullName} (${deleted.email}) ha sido eliminado definitivamente.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/candidates error:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar candidato." },
      { status: 500 }
    );
  }
}
