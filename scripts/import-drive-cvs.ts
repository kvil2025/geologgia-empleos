import "../src/lib/pdf-polyfill";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parsePdfCv } from "../src/lib/cv-parser";
import prisma from "../src/lib/prisma";

function inferNameFromFilename(filename: string): string | null {
  const clean = filename
    .replace(/^x22/i, "")
    .replace(/\.pdf$/i, "")
    .replace(/^(?:curriculum[_\-\s]*vitae|curriculum|cv)[_\-\s]*/i, "")
    .replace(/[_\-]+/g, " ")
    .trim();

  if (clean.length >= 3 && !/^(?:cv|curriculum|geologo|doc|documento)$/i.test(clean)) {
    return clean
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return null;
}

async function runImport() {
  const cvsDir = path.join(process.cwd(), "drive_cvs");
  if (!fs.existsSync(cvsDir)) {
    console.error(`Directory not found: ${cvsDir}`);
    return;
  }

  const files = fs.readdirSync(cvsDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`\n============================================================`);
  console.log(`📂 IMPORTACIÓN AUTOMÁTICA DE CVS DESDE GOOGLE DRIVE`);
  console.log(`📁 Carpeta: BOLSA DE TRABAJO 2026 (${files.length} archivos detectados)`);
  console.log(`============================================================\n`);

  let importedCount = 0;
  let udecCount = 0;

  for (const file of files) {
    const fullPath = path.join(cvsDir, file);
    console.log(`------------------------------------------------------------`);
    console.log(`📄 Procesando: ${file}`);
    
    try {
      const buffer = fs.readFileSync(fullPath);
      const parsed = await parsePdfCv(buffer);

      const inferred = inferNameFromFilename(file);
      const finalName = (parsed.fullName && parsed.fullName !== "Colega Geólogo(a)")
        ? parsed.fullName
        : (inferred || "Colega Geólogo(a)");

      console.log(`👤 Nombre final: ${finalName}`);
      console.log(`🎓 Título: ${parsed.title || "Geólogo(a)"}`);
      console.log(`🏛️ Universidad: ${parsed.university || "No detectada"}`);
      console.log(`🌟 Distinción UdeC: ${parsed.isUdec ? "🎓 SÍ (Alumni Preferente)" : "No"}`);
      console.log(`⏱️ Años Experiencia: ${parsed.yearsExp} años`);
      console.log(`🛠️ Especialidades: ${parsed.specialties.join(", ")}`);
      console.log(`📧 Correo: ${parsed.email || "No detectado"}`);
      console.log(`📞 Teléfono: ${parsed.phone || "No detectado"}`);
      console.log(`📝 Resumen: ${parsed.summary?.substring(0, 120)}...`);

      const email = parsed.email || `${finalName.toLowerCase().replace(/\s+/g, ".")}@geologgia-candidato.cl`;
      const base64Pdf = `data:application/pdf;base64,${buffer.toString("base64")}`;
      const managementToken = crypto.randomBytes(16).toString("hex");

      // Check if already registered
      const existing = await prisma.candidate.findFirst({
        where: { email },
      });

      if (existing) {
        console.log(`ℹ️ Candidato ya existía (${email}). Actualizando antecedentes...`);
        await prisma.candidate.update({
          where: { id: existing.id },
          data: {
            fullName: finalName,
            title: parsed.title || existing.title,
            university: parsed.university || existing.university,
            isUdec: parsed.isUdec || existing.isUdec,
            yearsExp: parsed.yearsExp || existing.yearsExp,
            specialties: parsed.specialties.join(", ") || existing.specialties,
            summary: parsed.summary || existing.summary,
            phone: parsed.phone || existing.phone,
            linkedinUrl: parsed.linkedinUrl || existing.linkedinUrl,
            cvUrl: base64Pdf,
            cvFileName: file,
            status: "ACTIVE",
          },
        });
      } else {
        await prisma.candidate.create({
          data: {
            fullName: finalName,
            title: parsed.title || "Geólogo / Geóloga",
            university: parsed.university || "Universidad no especificada",
            isUdec: parsed.isUdec,
            isEarlyBird: true,
            yearsExp: parsed.yearsExp || 1,
            specialties: parsed.specialties.join(", ") || "Geología General, Mapeo, QA/QC",
            preferredShift: "7x7 o 4x3",
            preferredRegion: "Todo Chile",
            summary: parsed.summary,
            phone: parsed.phone || null,
            email,
            linkedinUrl: parsed.linkedinUrl || null,
            cvUrl: base64Pdf,
            cvFileName: file,
            status: "ACTIVE",
            managementToken,
          },
        });
        console.log(`✅ ¡Candidato guardado exitosamente en Neon PostgreSQL!`);
      }

      importedCount++;
      if (parsed.isUdec) udecCount++;
    } catch (err: any) {
      console.error(`❌ Error procesando ${file}:`, err.message || err);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 IMPORTACIÓN FINALIZADA CON ÉXITO`);
  console.log(`📊 Total procesados: ${importedCount} / ${files.length}`);
  console.log(`🎓 Colegas Alumni UdeC identificados: ${udecCount}`);
  console.log(`🌐 Visibles en: https://empleos.geologgia.cl`);
  console.log(`🛠️ Moderación en: https://empleos.geologgia.cl/admin`);
  console.log(`============================================================\n`);
}

runImport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
