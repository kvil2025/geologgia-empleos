import "./pdf-polyfill";
import { PDFParse } from "pdf-parse";

export interface ParsedCVData {
  fullName: string;
  title: string;
  university: string;
  isUdec: boolean;
  yearsExp: number;
  specialties: string[];
  summary: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  preferredShift: string;
  preferredRegion: string;
  rawTextPreview: string;
}

const KNOWN_UNIVERSITIES: { name: string; isUdec: boolean; patterns: RegExp[] }[] = [
  {
    name: "Universidad de Concepción",
    isUdec: true,
    patterns: [/universidad\s+de\s+concepci[oó]n/i, /\budec\b/i, /u\.\s*de\s*concepci[oó]n/i],
  },
  {
    name: "Universidad de Chile",
    isUdec: false,
    patterns: [/universidad\s+de\s+chile/i, /\buchile\b/i, /fcfm/i],
  },
  {
    name: "Universidad Católica del Norte",
    isUdec: false,
    patterns: [/universidad\s+cat[oó]lica\s+del\s+norte/i, /\bucn\b/i],
  },
  {
    name: "Universidad de Atacama",
    isUdec: false,
    patterns: [/universidad\s+de\s+atacama/i, /\buda\b/i],
  },
  {
    name: "Pontificia Universidad Católica de Chile",
    isUdec: false,
    patterns: [/pontificia\s+universidad\s+cat[oó]lica/i, /\bpuc\b/i],
  },
  {
    name: "Universidad Andrés Bello",
    isUdec: false,
    patterns: [/universidad\s+andr[eé]s\s+bello/i, /\bunab\b/i],
  },
  {
    name: "Universidad Mayor",
    isUdec: false,
    patterns: [/universidad\s+mayor\b/i],
  },
  {
    name: "Universidad Austral de Chile",
    isUdec: false,
    patterns: [/universidad\s+austral/i, /\buach\b/i],
  },
];

const GEOLOGY_KEYWORDS = [
  "Leapfrog Geo",
  "Maptek Vulcan",
  "Datamine",
  "IoGAS",
  "Sondajes DDH",
  "Sondajes RC",
  "Control QA/QC",
  "Logueo de Testigos",
  "Mapeo Lito-Estructural",
  "Geotecnia Rajo",
  "Geotecnia Subterránea",
  "Hidrogeología",
  "QGIS",
  "ArcGIS Pro",
  "Pórfidos Cu-Mo",
  "Epitermales Au-Ag",
  "Geoestadística",
  "Muestreo de Canales",
];

// Fallback: extract visible text from raw buffer streams if pdf-parse encounters weird streams
function extractRawBufferText(buffer: Buffer): string {
  const str = buffer.toString("latin1");
  const matches = str.match(/\(([^)]+)\)\s*(?:Tj|'|")/g) || [];
  const textPieces = matches.map((m) => m.replace(/^[('"]|[)'"]$/g, "")).join(" ");
  if (textPieces.length > 50) return textPieces;

  // Generic ASCII / printable string extraction
  const cleanAscii = str.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ");
  return cleanAscii;
}

// Optional Gemini multimodal parser if GEMINI_API_KEY is available
async function parseWithGeminiIfAvailable(buffer: Buffer): Promise<ParsedCVData | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const base64Pdf = buffer.toString("base64");
    const prompt = `Analiza este Curriculum Vitae de geología/minería en Chile y responde ÚNICAMENTE con un objeto JSON válido con este formato exacto:
{
  "fullName": "Nombre y Apellidos",
  "title": "Cargo o título profesional más relevante (ej. Geólogo Senior, Geólogo de Sondajes, Ingeniero Geotécnico)",
  "university": "Nombre de la Universidad de egreso",
  "isUdec": true o false (true si es Universidad de Concepción o correo @udec.cl),
  "yearsExp": número estimado de años de experiencia profesional (ej. 5),
  "specialties": ["Especialidad 1", "Software 1", "Técnica 1"],
  "summary": "Resumen ejecutivo profesional de 2 a 3 líneas redactado para reclutadores de faena minera",
  "email": "correo@ejemplo.com",
  "phone": "+569...",
  "linkedinUrl": "https://linkedin.com/in/...",
  "preferredShift": "7x7 o el detectado",
  "preferredRegion": "Región o faena detectada o Norte Grande"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) return null;
    const json = await res.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const data = JSON.parse(candidateText);
    return {
      fullName: data.fullName || "Colega Geólogo(a)",
      title: data.title || "Geólogo(a)",
      university: data.university || "Universidad de Concepción",
      isUdec: Boolean(data.isUdec),
      yearsExp: Number(data.yearsExp) || 3,
      specialties: Array.isArray(data.specialties) ? data.specialties : ["Leapfrog Geo", "QA/QC"],
      summary: data.summary || "Geólogo(a) con experiencia en terreno y minería en Chile.",
      email: data.email || "",
      phone: data.phone || "",
      linkedinUrl: data.linkedinUrl || "",
      preferredShift: data.preferredShift || "7x7",
      preferredRegion: data.preferredRegion || "Antofagasta / Atacama",
      rawTextPreview: "Procesado con Google Gemini Multimodal",
    };
  } catch (err) {
    console.warn("Gemini parsing failed, falling back to local NLP parser:", err);
    return null;
  }
}

export async function parsePdfCv(buffer: Buffer): Promise<ParsedCVData> {
  // 1. Try Gemini if API key is present
  const geminiResult = await parseWithGeminiIfAvailable(buffer);
  if (geminiResult) return geminiResult;

  // 2. Otherwise run local zero-cost NLP engine
  let text = "";

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = (result as any)?.text || "";
    await parser.destroy();
  } catch (err) {
    console.warn("PDFParse getText warning, using stream extraction fallback:", err);
    text = extractRawBufferText(buffer);
  }

  if (!text || text.trim().length === 0) {
    text = extractRawBufferText(buffer);
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Detect Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // Detect Phone
  const phoneMatch = text.match(/(?:\+?56\s?)?9\s?[0-9]{4}\s?[0-9]{4}|9\s?[0-9]{8}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : "";

  // Detect LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-_]+/i);
  const linkedinUrl = linkedinMatch ? `https://${linkedinMatch[0]}` : "";

  // Detect University & UdeC
  let detectedUniversity = "Otra Universidad";
  let isUdec = false;

  for (const uni of KNOWN_UNIVERSITIES) {
    if (uni.patterns.some((p) => p.test(text))) {
      detectedUniversity = uni.name;
      isUdec = uni.isUdec;
      break;
    }
  }

  if (email.endsWith("@udec.cl") || email.endsWith("@alumnos.udec.cl")) {
    detectedUniversity = "Universidad de Concepción";
    isUdec = true;
  }

  // Detect Full Name
  let fullName = "Colega Geólogo(a)";
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i];
    if (
      !/curriculum|vitae|resumen|datos|personales|contacto|p[aá]gina|email|correo|chile|perfil/i.test(line) &&
      line.length > 4 &&
      line.length < 50 &&
      /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s.]+$/.test(line)
    ) {
      fullName = line;
      break;
    }
  }

  // Detect Professional Title
  let title = "Geólogo(a)";
  if (/ge[oó]log[oa]\s+senior/i.test(text)) {
    title = "Geólogo(a) Senior";
  } else if (/ge[oó]log[oa]\s+de\s+exploraci[oó]n/i.test(text)) {
    title = "Geólogo(a) de Exploración";
  } else if (/ge[oó]log[oa]\s+de\s+sondajes/i.test(text)) {
    title = "Geólogo(a) de Sondajes & QA/QC";
  } else if (/ge[oó]log[oa]\s+de\s+producci[oó]n/i.test(text) || /ge[oó]log[oa]\s+de\s+mina/i.test(text)) {
    title = "Geólogo(a) de Mina / Rajo";
  } else if (/geot[eé]cnic[oa]/i.test(text)) {
    title = "Ingeniero(a) Geotécnico(a)";
  } else if (/hidroge[oó]log[oa]/i.test(text)) {
    title = "Hidrogeólogo(a)";
  } else if (/ingenier[oa]\s+ge[oó]log[oa]/i.test(text)) {
    title = "Ingeniero(a) Geólogo(a)";
  }

  // Calculate Years of Experience
  const currentYear = 2026;
  const yearMatches = text.match(/\b(199\d|20[0-2]\d)\b/g);
  let minYear = currentYear;
  if (yearMatches) {
    const years = yearMatches
      .map((y) => parseInt(y, 10))
      .filter((y) => y >= 1995 && y <= currentYear);
    if (years.length > 0) {
      minYear = Math.min(...years);
    }
  }
  const estimatedExp = Math.max(1, Math.min(30, currentYear - minYear));

  // Extract Specialties
  const foundSpecialties: string[] = [];
  GEOLOGY_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (regex.test(text)) {
      foundSpecialties.push(kw);
    }
  });

  if (foundSpecialties.length === 0) {
    foundSpecialties.push("Mapeo Geológico", "Control QA/QC", "Leapfrog Geo");
  }

  // Generate Executive Summary
  const uniText = isUdec
    ? "titulado(a) de la Universidad de Concepción (Alumni UdeC)"
    : `egresado(a) de ${detectedUniversity}`;

  const summary = `${title} ${uniText}, con aproximadamente ${estimatedExp} ${
    estimatedExp === 1 ? "año" : "años"
  } de trayectoria en terreno y faena minera en Chile. Destaca por sólidos conocimientos en ${foundSpecialties
    .slice(0, 4)
    .join(", ")}, con experiencia en proyectos de exploración y operaciones mineras bajo estrictos estándares de seguridad y calidad.`;

  return {
    fullName,
    title,
    university: detectedUniversity,
    isUdec,
    yearsExp: estimatedExp,
    specialties: foundSpecialties,
    summary,
    email,
    phone,
    linkedinUrl,
    preferredShift: "7x7",
    preferredRegion: "Antofagasta / Atacama",
    rawTextPreview: text.substring(0, 300),
  };
}
