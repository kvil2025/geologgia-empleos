# GEOLOGGIA EMPLEOS — Proyecto Independiente

Este repositorio y carpeta contiene el **código fuente completo, 100% independiente y aislado** de la plataforma laboral **Geologgia Empleos** (Chile).

🌐 **Producción:** [https://geologgia-empleos.vercel.app](https://geologgia-empleos.vercel.app)  
🌐 **Dominio:** [https://empleos.geologgia.cl](https://empleos.geologgia.cl)

---

## 📁 Estructura del Proyecto (Completamente Separado de SOSCARD)

```
geologgia-empleos/
├── prisma/
│   └── schema.prisma           # Esquema de BD aislado (schema=geologgia_empleos)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── candidates/
│   │   │   │   ├── route.ts         # Listar y registrar candidatos (UdeC + 100 gratis)
│   │   │   │   ├── manage/route.ts  # Autogestión por Magic Link (Pausar/Editar)
│   │   │   │   └── parse-cv/route.ts # Extracción de CV PDF con IA + Polyfill
│   │   │   └── jobs/
│   │   │       └── route.ts         # Ofertas laborales mineras y filtros
│   │   ├── autogestion/
│   │   │   └── page.tsx             # Panel de autogestión para el colega
│   │   ├── globals.css              # Estilos Bento Dark Cyber-Minimalist
│   │   ├── layout.tsx               # Metadatos, fuentes Inter + JetBrains Mono y Umami
│   │   └── page.tsx                 # Portal principal: Hero Canvas, Bento Grid, Modales
│   └── lib/
│       ├── cv-parser.ts             # Motor NLP de Geociencias y detección UdeC
│       ├── pdf-polyfill.ts          # Polyfill DOMMatrix/ImageData para Serverless Vercel
│       └── prisma.ts                # Conexión Singleton a Neon PostgreSQL
├── .env                             # Variables de entorno aisladas (schema=geologgia_empleos)
├── package.json                     # Dependencias propias (Next.js 16, Prisma 5, Tailwind 4)
└── tsconfig.json
```

---

## 🗄️ Base de Datos
- **Motor:** Neon Serverless PostgreSQL
- **Esquema:** `geologgia_empleos` (totalmente separado del esquema `public` de SOSCARD).
- **Tablas:**
  - `Job`: Vacantes laborales mineras (Turno 7x7, faena, exploración, geotecnia).
  - `Candidate`: Fichas de colegas, bandera `isUdec`, `isEarlyBird`, enlace PDF de CV y `managementToken`.

---

## 🚀 Comandos de Ejecución Local
```bash
# Instalar dependencias
npm install

# Compilar proyecto
npm run build

# Ejecutar en desarrollo
npm run dev

# Desplegar a producción
npx vercel --prod
```
