import "@/lib/pdf-polyfill";
import { NextRequest, NextResponse } from "next/server";
import { parsePdfCv } from "@/lib/cv-parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se adjuntó ningún archivo PDF" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "El archivo debe estar en formato PDF (.pdf)." },
        { status: 400 }
      );
    }

    // Maximum file size protection (5 MB limit to prevent memory exhaustion DoS)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "El archivo excede el tamaño máximo permitido de 5 MB." },
        { status: 413 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF Magic Bytes (%PDF-) to prevent malicious non-PDF uploads
    const header = buffer.subarray(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF")) {
      return NextResponse.json(
        { success: false, error: "El archivo no es un documento PDF válido." },
        { status: 400 }
      );
    }

    // Parse CV text & extract domain metadata
    const parsed = await parsePdfCv(buffer);

    // Save as base64 data URI so it can be previewed/downloaded immediately
    const base64Pdf = `data:application/pdf;base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      parsed,
      fileName: file.name,
      fileSize: file.size,
      cvUrl: base64Pdf,
    });
  } catch (error: any) {
    console.error("Error parsing CV in route:", error);
    return NextResponse.json(
      { success: false, error: "No pudimos procesar el archivo PDF. Intenta con otro archivo o completa los campos manualmente." },
      { status: 500 }
    );
  }
}
