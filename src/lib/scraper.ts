import prisma from "./prisma";

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  shift?: string;
  category: string;
  description: string;
  requirements?: string;
  salary?: string;
  applyUrl: string;
  source: string;
  isFeatured?: boolean;
}

// Initial realistic active mining/geology vacancies in Chile
export const INITIAL_GEO_JOBS: ScrapedJob[] = [
  {
    title: "Geólogo de Exploración Brownfield (Pórfidos Cu-Mo)",
    company: "Minera Centinela / Antofagasta Minerals",
    location: "Región de Antofagasta (Sierra Gorda)",
    shift: "7x7",
    category: "Exploración",
    description: "Liderar campañas de mapeo estructural superficial y subterráneo, loggeo litológico y alteración en sondajes DDH. Supervisión de contratistas de perforación y aseguramiento QA/QC.",
    requirements: "Título de Geólogo(a). Mínimo 3 años de experiencia en exploración de pórfidos cupríferos. Manejo de Leapfrog Geo y acervo en muestreo QA/QC. Licencia clase B vigente.",
    salary: "$2.800.000 - $3.400.000 líquidos",
    applyUrl: "https://www.aminerals.cl/trabaja-con-nosotros/",
    source: "Portal Minero",
    isFeatured: true,
  },
  {
    title: "Geólogo QA/QC y Control de Sondajes DDH/RC",
    company: "Major Drilling Chile",
    location: "Copiapó / Tierra Amarilla (Región de Atacama)",
    shift: "7x7",
    category: "Sondajes & QAQC",
    description: "Control de testigos, orientación de sondajes (Reflex ACT III), supervisión de recuperación RQD, densidad de roca e inserción de estándares, blancos y duplicados.",
    requirements: "Geólogo(a) o Ingeniero(a) Geólogo(a) titulado(a). 1 a 3 años de experiencia en faena o sondajes de diamantina. Salud compatible con gran altitud geográfica (sobre 3.500 msnm).",
    salary: "$2.100.000 - $2.500.000 líquidos",
    applyUrl: "https://majordrilling.com/careers/",
    source: "Chiletrabajos",
    isFeatured: false,
  },
  {
    title: "Ingeniero(a) Geotécnico de Operaciones Rajo Abierto",
    company: "BHP Minera Escondida",
    location: "Antofagasta (Faena Escondida)",
    shift: "4x3",
    category: "Geotecnia",
    description: "Monitoreo de estabilidad de taludes con radares IBIS/GroundProbe, levantamiento estructural de bancos, inspección de prismas y evaluación de cuñas geomecánicas.",
    requirements: "Ingeniero(a) Civil de Minas, Ingeniero(a) Geólogo(a) o Geólogo(a) con mención en geotecnia. 4+ años en minería a cielo abierto. Manejo de Rocscience (Slide3, Dips) y radares.",
    salary: "$3.500.000 - $4.200.000 líquidos",
    applyUrl: "https://careers.bhp.com/",
    source: "LinkedIn Jobs",
    isFeatured: true,
  },
  {
    title: "Geólogo(a) de Producción y Control de Mineral (Grade Control)",
    company: "Kinross Gold Corporation (Faena La Coipa)",
    location: "Región de Atacama (Maricunga)",
    shift: "7x7",
    category: "Minería",
    description: "Muestreo de pozos de tronadura (blast holes), modelamiento de dominios de alta ley Au-Ag, reconciliación mina-planta y coordinación con despacho mina.",
    requirements: "Geólogo titulado. 2+ años en minería a cielo abierto o control de leyes en yacimientos epitermales. Manejo de Vulcan o Datamine.",
    salary: "$2.600.000 - $3.100.000 líquidos",
    applyUrl: "https://jobs.kinross.com/",
    source: "Portal Minero",
    isFeatured: false,
  },
  {
    title: "Geólogo(a) de Sondajes Auger / Mapeo de Tierras Raras (REE)",
    company: "Inducta SpA / Minera Aclara",
    location: "Región de Ñuble / Concepción",
    shift: "5x2 (Terreno continuo)",
    category: "Sondajes & QAQC",
    description: "Ejecución y supervisión de sondajes Auger en arcillas iónicas, muestreo vertical de Nd/Pr, medición de densidad in-situ, descripción litológica de regolito y correlación con perfiles meteorización.",
    requirements: "Geólogo(a) titulado(a) o egresado(a) con tesis en geoquímica/regolito. Proactivo, capacidad de trabajo en terreno forestal/agrícola. Manejo de QGIS y tablet GPS.",
    salary: "$1.800.000 - $2.200.000 líquidos",
    applyUrl: "https://geologgia.cl/contacto",
    source: "Comunidad Geologgia",
    isFeatured: true,
  },
  {
    title: "Geólogo(a) Hidrogeólogo(a) Junior / Modelamiento de Cuencas",
    company: "SRK Consulting Chile",
    location: "Santiago (Providencia) con visitas a terreno",
    shift: "5x2 Híbrido",
    category: "Hidrogeología",
    description: "Pruebas de bombeo, piezometría, muestreo isotópico de aguas subterráneas y balance hídrico para proyectos de permisos ambientales (EIA/DIA) en salares y cordillera.",
    requirements: "Geólogo(a) o Ingeniero(a) en Recursos Hídricos. 1-2 años de experiencia o pasantía en hidrogeología. Conocimiento de FEFLOW o MODFLOW es un plus.",
    salary: "$1.900.000 - $2.400.000 líquidos",
    applyUrl: "https://www.srk.com/es/carreras",
    source: "Chiletrabajos",
    isFeatured: false,
  },
  {
    title: "Geólogo(a) de Terreno y Mapeo Estructural 1:10.000",
    company: "Geologgia Consultores SpA",
    location: "Región de Coquimbo / Atacama",
    shift: "10x5 (Campaña)",
    category: "Exploración",
    description: "Mapeo lito-estructural en franja Cretácica, muestreo de esquirlas de roca (rock chip), trincheras y análisis de alteración hidrotermal con espectrómetro portátil TerraSpec.",
    requirements: "Geólogo(a) titulado(a) con sólida base en geología de campo y brújula Brunton. Licencia conducir clase B 4x4.",
    salary: "$2.200.000 líquidos",
    applyUrl: "mailto:contacto@geologgia.cl",
    source: "Comunidad Geologgia",
    isFeatured: true,
  }
];

export async function seedInitialJobsIfEmpty() {
  try {
    const count = await prisma.job.count();
    if (count === 0) {
      console.log("Seeding initial Chilean geology jobs...");
      for (const job of INITIAL_GEO_JOBS) {
        await prisma.job.create({
          data: job,
        });
      }
      console.log(`Seeded ${INITIAL_GEO_JOBS.length} jobs.`);
    }
  } catch (err: any) {
    console.error("Error seeding initial jobs:", err.message);
  }
}
