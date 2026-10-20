import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "GEOLOGGIA EMPLEOS — Bolsa Laboral Minera y Geocientífica de Chile",
  description: "Ofertas laborales activas en faena y exploración para Geólogos, Ingenieros Geólogos y Geotécnicos en Chile. Publicación libre, bolsa de talentos y turnos 7x7.",
  keywords: "empleos geologia chile, geologo faena minera, turno 7x7 antofagasta, sondajes ddh rc, leapfrog geo, qa qc geologia, geotecnia rajo, geologgia consultores",
  metadataBase: new URL("https://empleos.geologgia.cl"),
  openGraph: {
    title: "GEOLOGGIA EMPLEOS | Ofertas y Talentos Geológicos en Chile",
    description: "Bolsa de trabajo abierta y actualizada para geólogos en minería, sondajes y exploración en Chile.",
    url: "https://empleos.geologgia.cl",
    siteName: "Geologgia Empleos",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEOLOGGIA EMPLEOS — Bolsa de Trabajo Minera Chile",
    description: "Ofertas de trabajo activas en minería y exploración para Geólogos en Chile.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-[#ededed] antialiased selection:bg-[#eab308]/20 selection:text-white font-sans">
        {children}
        <Script
          src="https://tecknologia-analytics.vercel.app/script.js"
          data-website-id="f14eb68d-6ded-4d75-9eb6-469e774e8a8f"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
