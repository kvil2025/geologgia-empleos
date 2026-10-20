"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Search,
  MapPin,
  Clock,
  DollarSign,
  PlusCircle,
  ExternalLink,
  Shield,
  Send,
  Building2,
  CheckCircle2,
  X,
  Share2,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Mail,
  Copy,
  Layers,
  Compass,
  Check,
  Filter,
  Zap,
  Activity,
  UploadCloud,
  FileText,
  Lock,
  Unlock,
  GraduationCap,
  Sparkle,
  Phone,
  Download,
  AlertCircle,
  Star,
  LogIn,
  ShieldCheck,
  KeyRound,
  LogOut,
  RefreshCw
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  shift?: string | null;
  category: string;
  description: string;
  requirements?: string | null;
  salary?: string | null;
  applyUrl?: string | null;
  applyEmail?: string | null;
  source: string;
  isFeatured: boolean;
  createdAt: string;
}

interface Candidate {
  id: string;
  fullName: string;
  title: string;
  university?: string | null;
  isUdec?: boolean;
  isEarlyBird?: boolean;
  yearsExp: number;
  specialties: string;
  preferredShift: string;
  preferredRegion: string;
  summary: string;
  linkedinUrl?: string | null;
  phone?: string | null;
  email: string;
  cvUrl?: string | null;
  cvFileName?: string | null;
  managementToken?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "Todas",
  "Exploración",
  "Minería",
  "Sondajes & QAQC",
  "Geotecnia",
  "Hidrogeología",
];

const CATEGORY_THEMES: Record<string, { dot: string; text: string }> = {
  "Exploración": { dot: "#38bdf8", text: "text-sky-400" },
  "Minería": { dot: "#f59e0b", text: "text-amber-400" },
  "Sondajes & QAQC": { dot: "#a855f7", text: "text-purple-400" },
  "Geotecnia": { dot: "#10b981", text: "text-emerald-400" },
  "Hidrogeología": { dot: "#06b6d4", text: "text-cyan-400" },
  "Todas": { dot: "#f59e0b", text: "text-white" },
};

function getCompanyMonogram(company: string): string {
  if (!company) return "MN";
  const words = company.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return company.substring(0, 2).toUpperCase();
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "candidates">("jobs");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [candidateFilter, setCandidateFilter] = useState<"all" | "udec">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [earlyBirdRemaining, setEarlyBirdRemaining] = useState<number>(87);
  const [loading, setLoading] = useState(true);

  // Authentication & OTP session state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [authEmail, setAuthEmail] = useState("");
  const [authOtpCode, setAuthOtpCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuggestion, setAuthSuggestion] = useState<string | null>(null);
  const [authPreviewCode, setAuthPreviewCode] = useState<string | null>(null);
  const [authCountdown, setAuthCountdown] = useState<number>(0);

  // Modals & Popups
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [dataConsent, setDataConsent] = useState(true);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Privacy gatekeeper state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showGatekeeperModal, setShowGatekeeperModal] = useState(false);
  const [gatekeeperEmail, setGatekeeperEmail] = useState("");
  const [gatekeeperTarget, setGatekeeperTarget] = useState<Candidate | null>(null);

  // Registration success
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    token: string;
    url: string;
    isUdec: boolean;
  } | null>(null);

  // AI CV Parsing state
  const [parsingCv, setParsingCv] = useState(false);
  const [parsedCvMeta, setParsedCvMeta] = useState<any>(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    shift: "7x7",
    category: "Exploración",
    description: "",
    requirements: "",
    salary: "",
    applyUrl: "",
    applyEmail: "",
  });

  const [candidateForm, setCandidateForm] = useState({
    fullName: "",
    title: "",
    university: "Universidad de Concepción",
    isUdec: true,
    yearsExp: 5,
    specialties: "Mapeo lito-estructural, Leapfrog Geo, QA/QC",
    preferredShift: "7x7",
    preferredRegion: "Antofagasta / Atacama",
    summary: "",
    linkedinUrl: "",
    phone: "",
    email: "",
    cvUrl: "",
    cvFileName: "",
  });

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check saved session
    const savedEmail = localStorage.getItem("geologgia_user_email");
    const savedToken = localStorage.getItem("geologgia_verified_token");
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsVerified(!!savedToken);
      setCandidateForm((prev) => ({ ...prev, email: savedEmail }));
      setIsUnlocked(true);
    }
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (authCountdown <= 0) return;
    const interval = setInterval(() => {
      setAuthCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [authCountdown]);

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "Todas") params.append("category", selectedCategory);
      if (searchQuery) params.append("q", searchQuery);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Candidates
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (candidateFilter === "udec") params.append("filter", "udec");

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        if (data.earlyBirdRemaining !== undefined) {
          setEarlyBirdRemaining(data.earlyBirdRemaining);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    } else {
      fetchCandidates();
    }
  }, [activeTab, selectedCategory, candidateFilter]);

  // Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000, radius: 140 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const particleCount = Math.min(50, Math.floor(width / 24));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.8,
      hue: Math.random() > 0.5 ? 42 : Math.random() > 0.25 ? 195 : 270,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < mouse.radius) {
          const force = (mouse.radius - mdist) / mouse.radius;
          p.x -= (mdx / mdist) * force * 1.5;
          p.y -= (mdy / mdist) * force * 1.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, 0.4)`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "jobs") {
      fetchJobs();
    }
  };

  // Send 6-digit OTP code to email
  const handleSendOtp = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || authEmail).trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes("@")) {
      setAuthError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuggestion(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "No se pudo enviar el código de seguridad.");
        if (data.suggestion) {
          setAuthSuggestion(data.suggestion);
        }
        return;
      }

      setAuthEmail(emailToUse);
      setAuthStep("otp");
      setAuthOtpCode("");
      setAuthCountdown(60);
      if (data.previewCode) {
        setAuthPreviewCode(data.previewCode);
      }
      setToastMessage(`Código enviado a ${emailToUse}`);
    } catch (err) {
      setAuthError("Error de conexión al enviar el código de seguridad.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify 6-digit OTP code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = authOtpCode.replace(/\D/g, "");
    if (!cleanCode || cleanCode.length !== 6) {
      setAuthError("Ingresa los 6 dígitos del código de verificación.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Código inválido o expirado.");
        return;
      }

      // Successful verification
      localStorage.setItem("geologgia_user_email", authEmail);
      localStorage.setItem("geologgia_verified_token", data.token || "");
      setUserEmail(authEmail);
      setIsVerified(true);
      setIsUnlocked(true);
      setShowLoginModal(false);
      setToastMessage(`✅ Identidad verificada con éxito: ${authEmail}`);

      // Auto-prefill if candidate already exists
      if (data.candidate) {
        const c = data.candidate;
        setCandidateForm((prev) => ({
          ...prev,
          fullName: c.fullName || prev.fullName,
          title: c.title || prev.title,
          university: c.university || prev.university,
          isUdec: c.isUdec,
          yearsExp: c.yearsExp,
          specialties: c.specialties || prev.specialties,
          preferredShift: c.preferredShift || prev.preferredShift,
          preferredRegion: c.preferredRegion || prev.preferredRegion,
          summary: c.summary || prev.summary,
          email: c.email,
          phone: c.phone || prev.phone,
          linkedinUrl: c.linkedinUrl || prev.linkedinUrl,
          cvUrl: c.cvUrl || prev.cvUrl,
          cvFileName: c.cvFileName || prev.cvFileName,
        }));
      } else {
        setCandidateForm((prev) => ({
          ...prev,
          email: authEmail,
        }));
      }

      // If pending gatekeeper target, execute
      if (gatekeeperTarget) {
        if (gatekeeperTarget.cvUrl) {
          window.open(gatekeeperTarget.cvUrl, "_blank");
        }
        setGatekeeperTarget(null);
      }
    } catch (err) {
      setAuthError("Error de conexión al verificar el código.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("geologgia_user_email");
    localStorage.removeItem("geologgia_verified_token");
    setUserEmail(null);
    setIsVerified(false);
    setIsUnlocked(false);
    setAuthStep("email");
    setAuthEmail("");
    setAuthOtpCode("");
    setToastMessage("Has cerrado sesión.");
  };

  const handleQuickLogin = (email: string) => {
    setAuthEmail(email);
    setAuthStep("email");
    setShowLoginModal(true);
    handleSendOtp(email);
  };

  // AI CV File Upload & Extraction Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Por favor selecciona un archivo PDF.");
      return;
    }

    setParsingCv(true);
    setToastMessage("Extrayendo datos de tu CV con IA...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/candidates/parse-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.parsed) {
        const p = data.parsed;
        setParsedCvMeta({
          fileName: data.fileName,
          isUdec: p.isUdec,
          university: p.university,
        });

        setCandidateForm((prev) => ({
          ...prev,
          fullName: p.fullName || prev.fullName,
          title: p.title || prev.title,
          university: p.university || prev.university,
          isUdec: p.isUdec,
          yearsExp: p.yearsExp || prev.yearsExp,
          specialties: p.specialties ? p.specialties.join(", ") : prev.specialties,
          summary: p.summary || prev.summary,
          email: p.email || prev.email || userEmail || "",
          phone: p.phone || prev.phone,
          linkedinUrl: p.linkedinUrl || prev.linkedinUrl,
          cvUrl: data.cvUrl,
          cvFileName: data.fileName,
        }));

        setToastMessage(
          p.isUdec
            ? "¡Excelente! Detectado egresado UdeC: Perfil Preferente Activado."
            : "¡CV analizado con éxito! Revisa los campos y confirma."
        );
      } else {
        alert(data.error || "No se pudo extraer el texto del PDF.");
      }
    } catch (err) {
      alert("Error al procesar el archivo PDF.");
    } finally {
      setParsingCv(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowJobModal(false);
        setToastMessage("¡Oferta publicada exitosamente en el portal!");
        setJobForm({
          title: "",
          company: "",
          location: "",
          shift: "7x7",
          category: "Exploración",
          description: "",
          requirements: "",
          salary: "",
          applyUrl: "",
          applyEmail: "",
        });
        fetchJobs();
      } else {
        alert(data.error || "Error al publicar");
      }
    } catch (err: any) {
      alert("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataConsent) {
      alert("Debes aceptar la autorización de tratamiento de datos conforme a la legislación chilena para publicar tu perfil.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidateForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCandidateModal(false);
        setRegistrationSuccess({
          token: data.managementToken,
          url: data.managementUrl,
          isUdec: data.isUdec,
        });
        fetchCandidates();
      } else {
        alert(data.error || "Error al registrar perfil");
      }
    } catch (err: any) {
      alert("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockDirectory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatekeeperEmail.includes("@")) {
      alert("Por favor ingresa un correo válido.");
      return;
    }
    const clean = gatekeeperEmail.trim().toLowerCase();
    setShowGatekeeperModal(false);
    setAuthEmail(clean);
    setAuthStep("email");
    setShowLoginModal(true);
    handleSendOtp(clean);
  };

  const triggerProtectedAction = (cand: Candidate, type: "contact" | "download") => {
    if (isUnlocked) {
      if (type === "download") {
        if (cand.cvUrl) {
          window.open(cand.cvUrl, "_blank");
        } else {
          alert("El colega no ha subido un archivo PDF adjunto.");
        }
      } else {
        window.location.href = `mailto:${cand.email}?subject=Contacto desde Geologgia Empleos`;
      }
    } else {
      setGatekeeperTarget(cand);
      setShowGatekeeperModal(true);
    }
  };

  const sharePortal = () => {
    const text = "Colegas, les comparto el portal de empleo geológico y red de profesionales en minería de Chile (turnos 7x7, sondajes, exploración):";
    const url = "https://empleos.geologgia.cl/?utm_source=whatsapp_share";
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
  };

  const copyJobLink = (job: Job) => {
    const url = `https://empleos.geologgia.cl/?job=${job.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
    setToastMessage("Enlace copiado al portapapeles.");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 bg-[#0d1117] border border-amber-500/40 text-white px-4 py-3 shadow-2xl flex items-center gap-3 text-xs font-mono backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07090e]/85 backdrop-blur-xl hairline-highlight">
        <nav className="flex h-14 items-center justify-between px-6 sm:px-8 max-w-7xl mx-auto">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 border border-amber-400/40 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 flex items-center justify-center text-[11px] font-black text-black font-mono shadow-sm group-hover:scale-105 transition-transform">
                GL
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors">
                    GEOLOGGIA
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold px-1 py-0.2 bg-amber-400/10 border border-amber-400/30">
                    EMPLEOS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider hidden sm:block">
                  Mining Hub · Geología UdeC & Faena Chile
                </span>
              </div>
            </a>
          </div>

          {/* Nav Links */}
          <ul className="hidden md:flex items-center gap-1 font-mono text-xs">
            <li>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-3 py-1.5 transition-all ${
                  activeTab === "jobs"
                    ? "text-white bg-white/[0.07] border border-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Ofertas Faena ({jobs.length})
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("candidates")}
                className={`px-3 py-1.5 transition-all ${
                  activeTab === "candidates"
                    ? "text-white bg-white/[0.07] border border-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Red de Talentos ({candidates.length})
              </button>
            </li>
            <li>
              <a
                href="#seguridad-faena"
                className="px-3 py-1.5 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-red-400" />
                <span>Seguridad Faena</span>
              </a>
            </li>
          </ul>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userEmail ? (
              <div className="hidden sm:inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-emerald-300 font-mono border border-emerald-500/30 bg-emerald-950/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[120px]">{userEmail}</span>
                  {isVerified && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">✓ Verificado</span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthStep("email");
                  setAuthError(null);
                  setShowLoginModal(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white font-mono transition-colors border border-white/10 hover:border-amber-400/40 bg-[#0d1117]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Ingresar</span>
              </button>
            )}

            <button
              onClick={sharePortal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-white/10 bg-[#0d1117] hover:border-emerald-500/40 transition-colors font-mono"
            >
              <Share2 className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setShowCandidateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-300 border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 transition-colors font-mono font-semibold"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Subir CV con IA</span>
            </button>

            <button
              onClick={() => setShowJobModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-all font-mono shadow-md cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-black" />
              <span>Publicar Oferta</span>
            </button>
          </div>
        </nav>
      </header>

      {/* 2. HERO: WITH INTERACTIVE SUBSURFACE CANVAS & EARLY BIRD FOMO BANNER */}
      <section className="relative border-b border-white/[0.08] bg-[#07090e] bg-grid-ultra overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
        />
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-20 relative z-10">
          <div className="max-w-3xl">
            {/* Live Early Bird Banner */}
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 bg-amber-500/[0.08] border border-amber-500/30 text-amber-300 font-mono text-xs mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="font-bold uppercase tracking-wider text-[11px]">
                LANZAMIENTO: Primeros 100 Geólogos Gratis
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-white font-semibold">
                Cupos restantes: <strong>{earlyBirdRemaining} / 100</strong>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-medium">🎓 Geólogos UdeC Perfil Preferente</span>
            </div>

            {/* High-Impact Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] mb-6">
              Oportunidades & Talento en{" "}
              <span className="bg-gradient-to-r from-sky-400 via-amber-300 to-purple-400 bg-clip-text text-transparent">
                Geociencias & Minería
              </span>
            </h1>

            {/* Clear Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl font-light mb-8 leading-relaxed">
              Plataforma abierta para Geólogos, Ingenieros Geólogos y Geotécnicos en Chile. Sube tu CV en PDF, la IA extrae tus competencias clave y conecta directamente con empresas, consultoras y proyectos en todo el país.
            </p>

            {/* Specialization Tags */}
            <div className="flex flex-wrap gap-2 mb-8 font-mono">
              <span className="px-2.5 py-1 text-xs text-amber-300 border border-amber-400/30 bg-amber-400/10 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Perfiles Preferentes UdeC
              </span>
              <span className="px-2.5 py-1 text-xs text-slate-300 border border-white/10 bg-[#0d1117] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" /> Turno 7x7 & 4x3
              </span>
              <span className="px-2.5 py-1 text-xs text-slate-300 border border-white/10 bg-[#0d1117]">
                Leapfrog Geo 3D
              </span>
              <span className="px-2.5 py-1 text-xs text-slate-300 border border-white/10 bg-[#0d1117]">
                Sondajes DDH / RC
              </span>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 border border-white/15 bg-[#0d1117]/90 focus-within:border-amber-400/70 transition-all shadow-inner">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cargo, faena o software (ej. Sondajes, UdeC, 7x7)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors font-mono cursor-pointer shrink-0 shadow-md"
              >
                Buscar Vacantes
              </button>
            </form>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="border-t border-white/[0.08] bg-[#090d14]/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Ofertas activas:</span>
              <strong className="text-white font-bold">{jobs.length}</strong>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Comunidad:</span>
              <strong className="text-white font-bold">Geología UdeC</strong>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Autogestión:</span>
              <strong className="text-white font-bold">Magic Link 100%</strong>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">Seguridad:</span>
              <strong className="text-white font-bold">Directorio Protegido</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID SECTION: JOBS / CANDIDATES */}
      <section id="briefcase" className="bg-[#07090e] flex-1">
        {/* Section Control Bar */}
        <div className="px-6 sm:px-8 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-mono">
              // 01 · CATÁLOGO DE CONVOCATORIAS & TALENTO
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {activeTab === "jobs" ? "Ofertas Laborales en Faena & Terreno" : "Red de Geólogos & Geotécnicos"}
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 border border-white/10 bg-[#0d1117] p-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-3.5 py-1.5 transition-all ${
                activeTab === "jobs"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ofertas ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-3.5 py-1.5 transition-all ${
                activeTab === "candidates"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Candidatos ({candidates.length})
            </button>
          </div>
        </div>

        {/* Category Filters Bar (for Jobs) */}
        {activeTab === "jobs" && (
          <div className="border-t border-white/[0.08] bg-[#0a0d14]/60">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtrar:
              </span>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES["Todas"];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-all border ${
                      isSelected
                        ? "border-white/30 bg-white/10 text-white font-semibold shadow-sm"
                        : "border-white/[0.07] bg-[#0d1117] text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.dot }}
                    />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Candidates Filter Bar */}
        {activeTab === "candidates" && (
          <div className="border-t border-white/[0.08] bg-[#0a0d14]/60">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCandidateFilter("all")}
                  className={`px-3 py-1.5 border transition-all ${
                    candidateFilter === "all"
                      ? "border-white/30 bg-white/10 text-white font-semibold"
                      : "border-white/10 bg-[#0d1117] text-slate-400 hover:text-white"
                  }`}
                >
                  Todos los Colegas ({candidates.length})
                </button>
                <button
                  onClick={() => setCandidateFilter("udec")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-all ${
                    candidateFilter === "udec"
                      ? "border-amber-400/50 bg-amber-400/20 text-amber-300 font-bold"
                      : "border-amber-400/20 bg-amber-400/[0.05] text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>⭐ Perfiles Preferentes Alumni UdeC</span>
                </button>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Unlock className="w-3.5 h-3.5" /> Directorio Desbloqueado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="w-3.5 h-3.5" /> Contactos protegidos contra spam
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="border-t border-white/[0.08] py-24 text-center">
            <div className="w-7 h-7 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-mono">Consultando base de datos PostgreSQL...</p>
          </div>
        )}

        {/* JOBS BENTO GRID */}
        {!loading && activeTab === "jobs" && (
          <div className="border-t border-white/[0.08]">
            {jobs.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto px-4">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No hay vacantes en esta categoría</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Prueba cambiando de filtro o publica tú la primera oferta para los colegas.
                </p>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="mt-4 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors font-mono"
                >
                  Publicar Oferta Ahora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto border-l border-white/[0.08]">
                {jobs.map((job) => {
                  const theme = CATEGORY_THEMES[job.category] || CATEGORY_THEMES["Exploración"];
                  const monogram = getCompanyMonogram(job.company);

                  return (
                    <div
                      key={job.id}
                      className="bento-card border-b border-r border-white/[0.08] p-6 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Metadata & Monogram Row */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-none border border-white/10 bg-[#161b26] flex items-center justify-center font-mono font-bold text-xs text-amber-300">
                              {monogram}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: theme.dot }}
                                />
                                <span className="text-[11px] font-mono text-slate-300 font-medium">
                                  {job.category}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {job.company}
                              </span>
                            </div>
                          </div>

                          {job.shift && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20">
                              {job.shift}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => setSelectedJobDetail(job)}
                          className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors cursor-pointer leading-snug mb-2"
                        >
                          {job.title}
                        </h3>

                        {/* Location & Compensation */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mb-3">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <DollarSign className="w-3 h-3" />
                              {job.salary}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                          {job.description}
                        </p>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-1.5 mb-5 font-mono">
                          <span className="px-2 py-0.5 text-[10px] text-slate-400 border border-white/[0.08] bg-[#161b26]">
                            Fuente: {job.source}
                          </span>
                          {job.shift && (
                            <span className="px-2 py-0.5 text-[10px] text-slate-400 border border-white/[0.08] bg-[#161b26]">
                              Turno Faena
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] text-slate-400 border border-white/[0.08] bg-[#161b26]">
                            Chile 2026
                          </span>
                        </div>
                      </div>

                      {/* Card Action Row */}
                      <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/[0.08] font-mono">
                        <a
                          href={job.applyUrl || `mailto:${job.applyEmail || "contacto@geologgia.cl"}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-200 hover:text-white border border-white/10 bg-[#161b26] hover:bg-white/10 px-3 py-1.5 transition-all"
                        >
                          <span>Postular</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>

                        <button
                          onClick={() => setSelectedJobDetail(job)}
                          className="text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Ver detalles</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CANDIDATES BENTO GRID */}
        {!loading && activeTab === "candidates" && (
          <div className="border-t border-white/[0.08]">
            {candidates.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto px-4">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No encontramos colegas con este filtro</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Sube tu CV para activar tu ficha profesional en la red.
                </p>
                <button
                  onClick={() => setShowCandidateModal(true)}
                  className="mt-4 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors font-mono"
                >
                  Subir mi CV con IA
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto border-l border-white/[0.08]">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className={`bento-card border-b border-r border-white/[0.08] p-6 flex flex-col justify-between group transition-all ${
                      cand.isUdec
                        ? "border-amber-500/40 bg-gradient-to-b from-[#131722] via-[#0d1117] to-[#0a0d14]"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            Disponible
                          </span>
                        </div>

                        {cand.isUdec ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/50 shadow-sm shadow-amber-500/10">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>PREFERENTE · ALUMNI UDEC</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/10 bg-[#161b26]">
                            {cand.university || "Geólogo Colega"}
                          </span>
                        )}
                      </div>

                      {/* Name & Title */}
                      <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                        <span>{cand.fullName}</span>
                        {cand.isUdec && (
                          <span title="Egresado Universidad de Concepción">🎓</span>
                        )}
                      </h3>
                      <p className="text-xs font-mono text-sky-400 mb-3">
                        {cand.title} · <span className="text-slate-400">{cand.yearsExp} {cand.yearsExp === 1 ? "año" : "años"} exp</span>
                      </p>

                      {/* Shift & Region */}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-300 font-mono mb-3">
                        <span className="px-2 py-0.5 border border-white/[0.08] bg-[#161b26]">
                          Turno: {cand.preferredShift}
                        </span>
                        <span className="px-2 py-0.5 border border-white/[0.08] bg-[#161b26]">
                          {cand.preferredRegion}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                        {cand.summary}
                      </p>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1 mb-5 font-mono">
                        {cand.specialties.split(",").slice(0, 4).map((spec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] text-slate-400 border border-white/[0.08] bg-[#161b26]"
                          >
                            {spec.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions with Privacy Protection */}
                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/[0.08] font-mono">
                      {cand.cvUrl ? (
                        <button
                          onClick={() => triggerProtectedAction(cand, "download")}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 bg-[#161b26] hover:bg-white/10 px-2.5 py-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-sky-400" />
                          <span>Descargar CV</span>
                        </button>
                      ) : cand.linkedinUrl ? (
                        <a
                          href={cand.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white border border-white/10 bg-[#161b26] hover:bg-white/10 px-2.5 py-1.5 transition-colors"
                        >
                          <span>LinkedIn</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={() => triggerProtectedAction(cand, "contact")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{isUnlocked ? "Contactar" : "Ver Contacto 🔒"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. SOSCARD PRO FEATURE SECTION */}
      <section id="seguridad-faena" className="border-t border-white/[0.08] bg-[#090c13] hairline-highlight">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14">
          <div className="border border-red-500/20 bg-gradient-to-r from-red-950/30 via-[#0d1117] to-amber-950/20 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
            <div className="flex items-start gap-5 z-10">
              <div className="w-12 h-12 border border-red-500/40 bg-red-950/50 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-900/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                    // PROTOCOLO DE SEGURIDAD PERSONAL EN FAENA
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30">
                    SOSCARD Pro
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
                  ¿Subes a Faena o Campamento? Protege tus cuentas bancarias
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                  En traslados o faena remota, si extravías tu celular o sufres un asalto, los delincuentes pueden vaciar tus cuentas y billeteras digitales. Con <strong>SOSCARD Pro</strong> bloqueas tus tarjetas de todos los bancos en Chile y alertar a tus contactos de emergencia en 1 toque.
                </p>
              </div>
            </div>

            <div className="z-10 shrink-0 w-full lg:w-auto">
              <a
                href="https://getsoscard.com/?utm_source=geologgia_empleos&utm_medium=banner_faena"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-all w-full sm:w-auto font-mono shadow-lg shadow-red-600/30"
              >
                <span>Conocer SOSCARD Pro</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MINIMALIST FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#07090e]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 border border-amber-400/40 bg-amber-400 flex items-center justify-center text-[9px] font-black text-black">
              GL
            </span>
            <p className="text-slate-400">
              Geologgia Consultores <span className="text-slate-600">· Portal de Empleos Chile 2026</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Aviso Legal & Ley de Datos</span>
            </button>
            <Link
              href="/admin"
              className="hover:text-amber-300 transition-colors flex items-center gap-1 text-slate-500"
              title="Acceso Administración"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Admin</span>
            </Link>
            <a
              href="https://geologgia.cl"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              geologgia.cl
            </a>
            <a
              href="https://getsoscard.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              SOSCARD Pro
            </a>
            <a
              href="https://www.tecknologia.cl"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Tecknologia Lab
            </a>
          </div>

          <div className="text-[11px] text-slate-500 max-w-md text-center sm:text-right">
            Cumplimiento estricto Ley N° 19.628 y Nueva Ley de Protección de Datos Personales de Chile.
          </div>
        </div>

        {/* Regulatory Disclaimer Bar */}
        <div className="border-t border-white/[0.05] bg-[#05070a] py-3 px-6 sm:px-8 text-center font-mono text-[10px] text-slate-500 leading-relaxed">
          🔒 <strong>Aviso de Protección de Datos (Chile):</strong> Los antecedentes, currículums y datos de contacto recopilados en esta plataforma son tratados exclusivamente con fines de intermediación laboral y vinculación técnico-profesional en minería. Los postulantes mantienen el control irrestricto de su información y pueden suspender su visibilidad o ejercer la eliminación definitiva (Derecho al Olvido) en cualquier momento desde su panel de autogestión.
        </div>
      </footer>

      {/* 6. DETAIL MODAL (JOB SPEC) */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/15 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 hairline-highlight">
            <button
              onClick={() => setSelectedJobDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: CATEGORY_THEMES[selectedJobDetail.category]?.dot || "#38bdf8" }}
              />
              <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                {selectedJobDetail.category}
              </span>
              {selectedJobDetail.shift && (
                <span className="px-2 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-400/30 bg-amber-400/10 font-bold">
                  Turno {selectedJobDetail.shift}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
              {selectedJobDetail.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mb-6">
              <span className="text-white flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {selectedJobDetail.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {selectedJobDetail.location}
              </span>
              {selectedJobDetail.salary && (
                <span className="text-emerald-400 font-semibold">
                  {selectedJobDetail.salary}
                </span>
              )}
            </div>

            {/* Description & Requirements */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-b border-white/[0.08] py-5 my-5">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">
                  // Descripción del Cargo & Responsabilidades
                </h4>
                <p className="whitespace-pre-line text-slate-200">
                  {selectedJobDetail.description}
                </p>
              </div>

              {selectedJobDetail.requirements && (
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">
                    // Requisitos de Terreno & Competencias
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">
                    {selectedJobDetail.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 font-mono">
              <button
                onClick={() => copyJobLink(selectedJobDetail)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 bg-[#161b26] px-3.5 py-2 transition-colors cursor-pointer"
              >
                {copiedId === selectedJobDetail.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedJobDetail(null)}
                  className="w-1/2 sm:w-auto px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>

                <a
                  href={selectedJobDetail.applyUrl || `mailto:${selectedJobDetail.applyEmail || "contacto@geologgia.cl"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-colors"
                >
                  <span>Postular Ahora</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: SUBIR CV CON CASILLA DE PERFIL PREFERENTE UDEC */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/15 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 hairline-highlight">
            <button
              onClick={() => setShowCandidateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1 font-mono text-xs text-slate-500">
              <span>// REGISTRO AUTÓNOMO & AUTOGESTIONABLE</span>
              <span className="text-amber-400 font-bold">· Cupos Restantes: {earlyBirdRemaining}/100</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
              Publicar Perfil en la Red de Talentos
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Sube tu CV en PDF y nuestra IA extraerá automáticamente tus años de experiencia, especialidades y universidad de origen.
            </p>

            {/* DRAG & DROP PDF ZONE */}
            <div className="mb-6 p-6 border-2 border-dashed border-amber-500/30 bg-[#161b26]/60 text-center relative group hover:border-amber-400 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={parsingCv}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2 font-mono">
                {parsingCv ? (
                  <>
                    <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin mb-1" />
                    <span className="text-xs text-amber-300 font-semibold">
                      Analizando PDF con IA (Experiencia, Software, Universidad)...
                    </span>
                  </>
                ) : parsedCvMeta ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs text-white font-semibold">{parsedCvMeta.fileName}</span>
                    <span className="text-[11px] text-emerald-400">
                      {parsedCvMeta.isUdec
                        ? "🎓 ¡Detectado: Egresado de Geología Universidad de Concepción!"
                        : `🏛️ Detectado: ${parsedCvMeta.university}`}
                    </span>
                    <span className="text-[10px] text-slate-500 underline mt-1">Haz clic para cambiar archivo</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-white font-semibold">
                      Arrastra tu CV aquí o haz clic para subirlo en PDF
                    </span>
                    <span className="text-[11px] text-slate-400">
                      La IA extraerá tus datos automáticamente en segundos
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* FORM FIELDS */}
            <form onSubmit={handleCandidateSubmit} className="space-y-4 font-mono text-xs">
              {/* PROMINENT UDEC PREFERENTIAL PERMIT CHECKBOX */}
              <div
                className={`p-4 border transition-all ${
                  candidateForm.isUdec
                    ? "bg-amber-400/[0.08] border-amber-400/50 shadow-sm"
                    : "bg-[#161b26] border-white/10"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={candidateForm.isUdec}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCandidateForm({
                        ...candidateForm,
                        isUdec: checked,
                        university: checked ? "Universidad de Concepción" : candidateForm.university,
                      });
                    }}
                    className="w-4 h-4 mt-0.5 rounded accent-amber-400 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      Soy Geólogo(a) titulado(a) de la Universidad de Concepción (UdeC)
                    </span>
                    <span className="text-xs text-slate-400 block mt-1 leading-relaxed">
                      Marca esta casilla para activar tu <strong>Perfil Preferente Alumni UdeC</strong> (prioridad en los primeros lugares de búsqueda y membresía gratuita vitalicia, con cualquier correo Gmail, Hotmail u otro).
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Cristian Ávila C."
                    value={candidateForm.fullName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Cargo / Especialidad Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Geólogo Senior de Exploración"
                    value={candidateForm.title}
                    onChange={(e) => setCandidateForm({ ...candidateForm, title: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Universidad de Egreso</label>
                  <input
                    type="text"
                    value={candidateForm.university}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isU = /concepci[oó]n|udec/i.test(val);
                      setCandidateForm({ ...candidateForm, university: val, isUdec: isU || candidateForm.isUdec });
                    }}
                    placeholder="ej. Universidad de Concepción"
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Años de Exp. en Terreno/Faena</label>
                  <input
                    type="number"
                    min={0}
                    max={45}
                    value={candidateForm.yearsExp}
                    onChange={(e) => setCandidateForm({ ...candidateForm, yearsExp: parseInt(e.target.value, 10) })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Turno Preferido</label>
                  <input
                    type="text"
                    placeholder="ej. 7x7 o 4x3"
                    value={candidateForm.preferredShift}
                    onChange={(e) => setCandidateForm({ ...candidateForm, preferredShift: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Región de Disponibilidad</label>
                  <input
                    type="text"
                    placeholder="ej. Antofagasta / Todo Chile"
                    value={candidateForm.preferredRegion}
                    onChange={(e) => setCandidateForm({ ...candidateForm, preferredRegion: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Software & Especialidades</label>
                <input
                  type="text"
                  placeholder="ej. Leapfrog Geo, Sondajes DDH/RC, QAQC, Vulcan, QGIS"
                  value={candidateForm.specialties}
                  onChange={(e) => setCandidateForm({ ...candidateForm, specialties: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Resumen Profesional (Generado o editable) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Experiencia en terreno, faenas en que has trabajado, competencias clave..."
                  value={candidateForm.summary}
                  onChange={(e) => setCandidateForm({ ...candidateForm, summary: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Correo Electrónico (Cualquiera) *</label>
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@gmail.com, hotmail, etc."
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+569..."
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Enlace a LinkedIn</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/tu-perfil"
                  value={candidateForm.linkedinUrl}
                  onChange={(e) => setCandidateForm({ ...candidateForm, linkedinUrl: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              {/* Consentimiento Expreso Ley de Datos de Chile */}
              <div className="p-3 bg-[#111620] border border-white/10 rounded space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    required
                    checked={dataConsent}
                    onChange={(e) => setDataConsent(e.target.checked)}
                    className="mt-0.5 accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Autorizo expresamente el tratamiento de mis datos laborales y CV para fines exclusivos de postulación e intermediación profesional conforme a la <strong>Ley N° 19.628</strong> y la <strong>Nueva Ley de Protección de Datos Personales de Chile</strong>. Entiendo que puedo pausar o eliminar mis datos en cualquier momento desde mi enlace de autogestión.
                  </span>
                </label>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Ver Política de Privacidad & Derechos ARCO →
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
                >
                  {submitting ? "Publicando..." : "Confirmar y Publicar mi Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: REGISTRATION SUCCESS */}
      {registrationSuccess && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-emerald-500/40 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 font-mono text-xs space-y-5">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                ¡Perfil Publicado Exitosamente!
              </h3>
              <p className="text-slate-400">
                {registrationSuccess.isUdec
                  ? "⭐ Quedaste registrado con PERFIL PREFERENTE Alumni Geología UdeC (Prioridad en Búsquedas)."
                  : "🎁 Quedaste registrado dentro de los Primeros 100 Geólogos Gratuitos."}
              </p>
            </div>

            <div className="p-4 bg-[#161b26] border border-white/10 space-y-2">
              <span className="text-amber-400 font-bold block">
                🔑 Tu Enlace Privado de Autogestión:
              </span>
              <p className="text-[11px] text-slate-400">
                Guarda este enlace para pausar tu ficha cuando encuentres trabajo o actualizar tu turno cuando lo desees:
              </p>
              <div className="p-2 bg-[#0d1117] border border-white/10 text-slate-300 break-all select-all font-mono text-[11px]">
                {registrationSuccess.url}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(registrationSuccess.url);
                  setToastMessage("Enlace de gestión copiado");
                }}
                className="px-4 py-2 border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Copiar Enlace
              </button>
              <button
                onClick={() => setRegistrationSuccess(null)}
                className="px-6 py-2 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
              >
                Entendido y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: DIRECTORY PRIVACY GATEKEEPER */}
      {showGatekeeperModal && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/20 max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-8 font-mono text-xs space-y-5">
            <button
              onClick={() => {
                setShowGatekeeperModal(false);
                setGatekeeperTarget(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-5 h-5" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Acceso a Contacto & Descarga de CV
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Para proteger la privacidad de los colegas contra bots y spam, ingresa tu correo para identificarte como reclutador o colega registrado:
              </p>
            </div>

            <form onSubmit={handleUnlockDirectory} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1">Tu Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="ej. reclutamiento@minera.cl o colega@gmail.com"
                  value={gatekeeperEmail}
                  onChange={(e) => setGatekeeperEmail(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGatekeeperModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Desbloquear Contactos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: LOGIN / VERIFICACIÓN DE CORREO OTP */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/20 max-w-sm w-full p-6 sm:p-7 shadow-2xl relative my-8 font-mono text-xs space-y-5">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setAuthError(null);
                setAuthSuggestion(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {authStep === "email" ? (
              <>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center text-amber-400 mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Verificación de Identidad
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Ingresa tu correo para recibir un código de seguridad de 6 dígitos. Protege tu perfil y garantiza que nadie use tu correo sin autorización.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuggestion && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-xs">
                    <p className="mb-2">¿Quisiste decir:</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail(authSuggestion);
                        setAuthSuggestion(null);
                        setAuthError(null);
                        handleSendOtp(authSuggestion);
                      }}
                      className="px-2 py-1 bg-amber-400 text-black font-bold text-xs rounded hover:bg-amber-300 transition-colors"
                    >
                      Sí, usar {authSuggestion}
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-slate-300 mb-1 font-sans text-xs">
                      Correo Electrónico (Gmail, Outlook, UdeC, etc.) *
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="ejemplo@gmail.com"
                      value={authEmail}
                      onChange={(e) => {
                        setAuthEmail(e.target.value);
                        setAuthError(null);
                        setAuthSuggestion(null);
                      }}
                      className="w-full bg-[#161b26] border border-white/15 px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || !authEmail}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer disabled:opacity-50 text-sm shadow-md"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando código...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Código de 6 Dígitos</span>
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  🔒 No enviamos spam. Solo usamos tu correo para autenticar la administración de tu ficha y avisos de postulaciones.
                </p>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-400 mx-auto mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Ingresa el Código OTP
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Código de 6 dígitos enviado a:<br />
                    <strong className="text-amber-300">{authEmail}</strong>
                  </p>
                </div>

                {authPreviewCode && (
                  <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded text-center text-amber-300 text-xs">
                    <p className="text-[11px] text-slate-400 mb-1">🧪 Modo Prueba / Verificación Directa:</p>
                    <div className="text-base font-bold font-mono text-white tracking-widest bg-black/50 py-1 rounded border border-amber-400/20">
                      {authPreviewCode}
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-center mb-2 text-xs">
                      CÓDIGO DE SEGURIDAD (6 NÚMEROS)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                      placeholder="000000"
                      value={authOtpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setAuthOtpCode(val);
                        setAuthError(null);
                      }}
                      className="w-full text-center text-2xl font-mono tracking-[0.5em] font-bold py-3 bg-[#161b26] border border-amber-400/50 text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || authOtpCode.length !== 6}
                    className="w-full py-2.5 bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 text-sm shadow-md"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando código...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Confirmar e Ingresar</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10 text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("email");
                      setAuthError(null);
                    }}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Cambiar correo
                  </button>

                  <button
                    type="button"
                    disabled={authCountdown > 0 || authLoading}
                    onClick={() => handleSendOtp(authEmail)}
                    className="hover:text-amber-400 underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                  >
                    {authCountdown > 0
                      ? `Reenviar en ${authCountdown}s`
                      : "Reenviar código"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 11. MODAL: PUBLICAR EMPLEO */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/15 max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 hairline-highlight">
            <button
              onClick={() => setShowJobModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1 font-mono">
              // PUBLICACIÓN DIRECTA
            </p>
            <h3 className="text-xl font-semibold text-white tracking-tight mb-2">
              Publicar Oferta Laboral Gratis
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Se indexará y publicará en tiempo real en la bolsa de Geologgia.
            </p>

            <form onSubmit={handleJobSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Cargo o Puesto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Geólogo de Sondajes DDH / Geotécnico de Rajo"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Empresa / Consultora *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Minera Centinela o Confidencial"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ubicación / Faena *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Sierra Gorda (Turno 7x7)"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Especialidad</label>
                  <select
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/70"
                  >
                    {CATEGORIES.filter((c) => c !== "Todas").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Turno</label>
                  <input
                    type="text"
                    placeholder="ej. 7x7, 4x3"
                    value={jobForm.shift}
                    onChange={(e) => setJobForm({ ...jobForm, shift: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Sueldo Estimado</label>
                  <input
                    type="text"
                    placeholder="ej. $2.800.000 líq"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="w-full bg-[#161b26] border border-white/10 px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Descripción del Cargo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Responsabilidades principales, software requerido (Leapfrog, Vulcan, QGIS), condiciones de faena..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Enlace o Correo para Postular *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. https://empresa.com/postular o reclutamiento@empresa.cl"
                  value={jobForm.applyUrl}
                  onChange={(e) => setJobForm({ ...jobForm, applyUrl: e.target.value })}
                  className="w-full bg-[#161b26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Al publicar esta oferta laboral, declaras que las condiciones cumplen con la legislación laboral chilena vigente y que el contacto es verídico.
              </p>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                >
                  {submitting ? "Publicando..." : "Publicar Oferta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. MODAL: POLÍTICA DE PRIVACIDAD & LEY DE DATOS DE CHILE */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1117] border border-white/20 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 font-mono text-xs space-y-5">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Política de Privacidad & Cumplimiento Legal
                </h3>
                <p className="text-[11px] text-amber-400">
                  Marco Regulatorio: Ley N° 19.628 y Nueva Ley de Protección de Datos Personales de Chile
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-slate-300 font-sans text-xs leading-relaxed">
              <section className="space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider text-amber-300">
                  1. Responsable del Tratamiento
                </h4>
                <p>
                  El responsable del banco de datos es <strong>Geologgia Consultores SpA</strong> en alianza con Tecknologia Lab. Domicilio legal en Concepción, Chile. Contacto de privacidad: <code className="text-sky-300">privacidad@geologgia.cl</code>.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider text-amber-300">
                  2. Finalidad Exclusiva
                </h4>
                <p>
                  Los antecedentes curriculares, títulos profesionales, experiencia en faena y datos de contacto recopilados se destinan <strong>única y exclusivamente a la intermediación laboral</strong>, facilitando que empresas mineras, contratistas y consultoras conecten con profesionales de las geociencias. No vendemos, no arrendamos ni compartimos tus datos con fines publicitarios ajenos al empleo.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider text-amber-300">
                  3. Base Legal y Consentimiento Informado
                </h4>
                <p>
                  El tratamiento se fundamenta en el <strong>consentimiento previo, libre, específico e informado</strong> otorgado voluntariamente por el titular de los datos al registrarse o enviar su currículum vítae, de conformidad con el artículo 4° de la Ley N° 19.628 sobre Protección de la Vida Privada.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider text-amber-300">
                  4. Derechos ARCO y Derecho al Olvido
                </h4>
                <p>
                  Conforme a la legislación chilena y los estándares de la nueva Agencia Nacional de Protección de Datos, garantizamos el ejercicio irrestricto de tus derechos:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Acceso:</strong> Puedes consultar en cualquier momento la ficha y antecedentes registrados.</li>
                  <li><strong>Rectificación:</strong> Puedes actualizar tu disponibilidad, región, pretensiones o experiencia desde tu panel de autogestión.</li>
                  <li><strong>Pausa de Visibilidad:</strong> Puedes suspender temporalmente tu perfil del directorio con 1 solo clic cuando encuentres trabajo ("Pausar Perfil").</li>
                  <li><strong>Supresión Definitiva (Derecho al Olvido):</strong> Puedes solicitar la eliminación total, inmediata e irreversible de tu CV y de todos tus registros desde tu panel de autogestión o escribiendo a nuestro canal de soporte.</li>
                </ul>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider text-amber-300">
                  5. Medidas de Seguridad Técnicas y Organizativas
                </h4>
                <p>
                  Implementamos salvaguardas técnicas estrictas: cifrado de extremo a extremo mediante protocolo TLS/HTTPS, autenticación de doble factor mediante códigos de seguridad de un solo uso (OTP) de 6 dígitos, protección contra raspadores automatizados (Gatekeeper), y almacenamiento en bases de datos con esquemas aislados y copias de seguridad continuas.
                </p>
              </section>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
              >
                Entendido y de Acuerdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
