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
    const statusFilter = searchParams.get("status"); // "ACTIVE", "CLOSED", "all"
    const featuredFilter = searchParams.get("featured"); // "true", "all"

    const where: any = {};
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }
    if (featuredFilter === "true") {
      where.isFeatured = true;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [jobs, totalCount, activeCount, closedCount, featuredCount] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.job.count({ where: { status: "CLOSED" } }),
      prisma.job.count({ where: { isFeatured: true } }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      stats: {
        total: totalCount,
        active: activeCount,
        closed: closedCount,
        featured: featuredCount,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/jobs error:", err);
    return NextResponse.json(
      { success: false, error: "Error al cargar ofertas laborales para administración." },
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
    const { id, status, isFeatured, title, company, location, shift, salary, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de oferta laboral requerido." },
        { status: 400 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(title && { title: title.trim() }),
        ...(company && { company: company.trim() }),
        ...(location && { location: location.trim() }),
        ...(shift && { shift: shift.trim() }),
        ...(salary && { salary: salary.trim() }),
        ...(description && { description: description.trim() }),
      },
    });

    return NextResponse.json({
      success: true,
      job: updated,
      message: `Oferta [${updated.title}] actualizada a estado [${updated.status}].`,
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/jobs error:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar oferta laboral." },
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
        { success: false, error: "ID de oferta laboral requerido para eliminar." },
        { status: 400 }
      );
    }

    const deleted = await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `La oferta laboral [${deleted.title}] de ${deleted.company} ha sido eliminada permanentemente.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/jobs error:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar oferta laboral." },
      { status: 500 }
    );
  }
}
