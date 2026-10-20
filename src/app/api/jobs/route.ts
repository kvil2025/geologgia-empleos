import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { seedInitialJobsIfEmpty } from "@/lib/scraper";

export async function GET(req: NextRequest) {
  try {
    await seedInitialJobsIfEmpty();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const q = searchParams.get("q");

    const where: any = { status: "ACTIVE" };

    if (category && category !== "Todas") {
      where.category = category;
    }

    if (location && location !== "Todas") {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    console.error("GET /api/jobs error:", err);
    return NextResponse.json(
      { success: false, error: "Error al cargar ofertas laborales." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      company,
      location,
      shift,
      category,
      description,
      requirements,
      salary,
      applyUrl,
      applyEmail,
    } = body;

    if (!title || !company || !location || !description) {
      return NextResponse.json(
        { success: false, error: "Por favor completa los campos obligatorios: Cargo, Empresa, Ubicación y Descripción." },
        { status: 400 }
      );
    }

    const finalApply = applyUrl || (applyEmail ? `mailto:${applyEmail}` : "https://geologgia.cl");

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        shift: shift ? shift.trim() : "Turno a convenir",
        category: category || "Exploración",
        description: description.trim(),
        requirements: requirements?.trim() || null,
        salary: salary?.trim() || "A convenir",
        applyUrl: finalApply,
        applyEmail: applyEmail?.trim() || null,
        source: "Comunidad Geologgia",
        isFeatured: false,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      job: newJob,
      message: "¡Oferta publicada exitosamente!",
    });
  } catch (err: any) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { success: false, error: "Error al registrar la oferta." },
      { status: 500 }
    );
  }
}
