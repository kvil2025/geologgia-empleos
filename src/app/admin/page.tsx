"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Users,
  Briefcase,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Star,
  ExternalLink,
  GraduationCap,
  RefreshCw,
  LogOut,
  ArrowLeft,
  KeyRound,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Check,
  X,
  FileText,
  Lock
} from "lucide-react";

interface Candidate {
  id: string;
  fullName: string;
  title: string;
  university: string | null;
  isUdec: boolean;
  isEarlyBird: boolean;
  yearsExp: number;
  specialties: string;
  preferredShift: string;
  preferredRegion: string;
  summary: string;
  linkedinUrl: string | null;
  phone: string | null;
  email: string;
  cvUrl: string | null;
  cvFileName: string | null;
  status: string; // "ACTIVE" | "PAUSED"
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  shift: string | null;
  category: string;
  description: string;
  requirements: string | null;
  salary: string | null;
  applyUrl: string | null;
  applyEmail: string | null;
  isFeatured: boolean;
  status: string; // "ACTIVE" | "CLOSED"
  createdAt: string;
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>("cavila1971@gmail.com");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Login form states
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<"candidates" | "jobs">("candidates");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateStats, setCandidateStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    udec: 0,
    earlyBirdRemaining: 100,
  });
  const [jobStats, setJobStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    featured: 0,
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<"all" | "ACTIVE" | "PAUSED">("all");
  const [candidateUdecFilter, setCandidateUdecFilter] = useState<"all" | "udec">("all");
  const [jobStatusFilter, setJobStatusFilter] = useState<"all" | "ACTIVE" | "CLOSED">("all");

  // Deletion modals
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check initial admin session on mount
  useEffect(() => {
    const savedAdminKey = localStorage.getItem("geologgia_admin_key");
    const savedUserEmail = localStorage.getItem("geologgia_user_email");
    const savedVerifiedToken = localStorage.getItem("geologgia_verified_token");

    if (savedAdminKey) {
      setAdminToken(savedAdminKey);
    } else if (
      savedUserEmail &&
      savedUserEmail.toLowerCase() === "cavila1971@gmail.com" &&
      savedVerifiedToken
    ) {
      // Auto-validate owner with verified OTP token
      attemptEmailLogin(savedUserEmail, savedVerifiedToken);
      return;
    }
    setLoading(false);
  }, []);

  const attemptEmailLogin = async (email: string, token: string) => {
    try {
      setAuthSubmitting(true);
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (data.success && data.adminToken) {
        setAdminToken(data.adminToken);
        setAdminEmail(data.email || email);
        localStorage.setItem("geologgia_admin_key", data.adminToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthSubmitting(false);
      setLoading(false);
    }
  };

  // Handle Master PIN login
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setLoginError("Ingresa tu PIN o Clave Maestra de Administrador.");
      return;
    }

    setAuthSubmitting(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (data.success && data.adminToken) {
        setAdminToken(data.adminToken);
        setAdminEmail(data.email || "cavila1971@gmail.com");
        localStorage.setItem("geologgia_admin_key", data.adminToken);
        setToastMessage("¡Bienvenido, Administrador!");
      } else {
        setLoginError(data.error || "Clave maestra incorrecta.");
      }
    } catch (err) {
      setLoginError("Error de conexión al autenticar.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("geologgia_admin_key");
    setAdminToken(null);
    setToastMessage("Sesión de administrador cerrada.");
  };

  // Fetch Candidates for Admin
  const fetchAdminCandidates = async () => {
    if (!adminToken) return;
    try {
      const params = new URLSearchParams();
      if (candidateStatusFilter !== "all") params.append("status", candidateStatusFilter);
      if (candidateUdecFilter === "udec") params.append("udec", "true");
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/admin/candidates?${params.toString()}`, {
        headers: { "x-admin-key": adminToken },
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        if (data.stats) setCandidateStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Jobs for Admin
  const fetchAdminJobs = async () => {
    if (!adminToken) return;
    try {
      const params = new URLSearchParams();
      if (jobStatusFilter !== "all") params.append("status", jobStatusFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/admin/jobs?${params.toString()}`, {
        headers: { "x-admin-key": adminToken },
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        if (data.stats) setJobStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!adminToken) return;
    if (activeTab === "candidates") {
      fetchAdminCandidates();
    } else {
      fetchAdminJobs();
    }
  }, [adminToken, activeTab, candidateStatusFilter, candidateUdecFilter, jobStatusFilter, searchQuery]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // TOGGLE CANDIDATE STATUS (ACTIVE <-> PAUSED)
  const toggleCandidateStatus = async (candidate: Candidate) => {
    const nextStatus = candidate.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoadingId(candidate.id);
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminToken!,
        },
        body: JSON.stringify({ id: candidate.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, status: nextStatus } : c))
        );
        setToastMessage(
          nextStatus === "PAUSED"
            ? `Perfil de ${candidate.fullName} pausado (dado de baja del portal público).`
            : `Perfil de ${candidate.fullName} reactivado en el portal.`
        );
        fetchAdminCandidates();
      } else {
        alert(data.error || "No se pudo actualizar el estado.");
      }
    } catch (err) {
      alert("Error de conexión al modificar estado.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // TOGGLE CANDIDATE UDEC DISTINCTION
  const toggleCandidateUdec = async (candidate: Candidate) => {
    const nextUdec = !candidate.isUdec;
    setActionLoadingId(candidate.id);
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminToken!,
        },
        body: JSON.stringify({ id: candidate.id, isUdec: nextUdec }),
      });
      const data = await res.json();
      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, isUdec: nextUdec } : c))
        );
        setToastMessage(
          nextUdec
            ? `Distinción Alumni UdeC activada para ${candidate.fullName}.`
            : `Distinción UdeC desactivada para ${candidate.fullName}.`
        );
        fetchAdminCandidates();
      }
    } catch (err) {
      alert("Error al actualizar distinción UdeC.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // DELETE CANDIDATE PERMANENTLY
  const executeDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    setActionLoadingId(candidateToDelete.id);
    try {
      const res = await fetch(`/api/admin/candidates?id=${candidateToDelete.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminToken! },
      });
      const data = await res.json();
      if (data.success) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id));
        setToastMessage(`Perfil y CV de ${candidateToDelete.fullName} eliminados definitivamente.`);
        setCandidateToDelete(null);
        fetchAdminCandidates();
      } else {
        alert(data.error || "No se pudo eliminar el candidato.");
      }
    } catch (err) {
      alert("Error de conexión al eliminar.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // TOGGLE JOB STATUS (ACTIVE <-> CLOSED)
  const toggleJobStatus = async (job: Job) => {
    const nextStatus = job.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    setActionLoadingId(job.id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminToken!,
        },
        body: JSON.stringify({ id: job.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
        );
        setToastMessage(
          nextStatus === "CLOSED"
            ? `Oferta "${job.title}" cerrada (dada de baja del portal).`
            : `Oferta "${job.title}" reactivada.`
        );
        fetchAdminJobs();
      }
    } catch (err) {
      alert("Error al actualizar oferta.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // TOGGLE JOB FEATURED
  const toggleJobFeatured = async (job: Job) => {
    const nextFeatured = !job.isFeatured;
    setActionLoadingId(job.id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminToken!,
        },
        body: JSON.stringify({ id: job.id, isFeatured: nextFeatured }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isFeatured: nextFeatured } : j))
        );
        setToastMessage(
          nextFeatured ? `Oferta destacada con éxito.` : `Oferta desmarcada de destacados.`
        );
        fetchAdminJobs();
      }
    } catch (err) {
      alert("Error al actualizar destacado.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // DELETE JOB PERMANENTLY
  const executeDeleteJob = async () => {
    if (!jobToDelete) return;
    setActionLoadingId(jobToDelete.id);
    try {
      const res = await fetch(`/api/admin/jobs?id=${jobToDelete.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminToken! },
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
        setToastMessage(`Oferta "${jobToDelete.title}" eliminada permanentemente.`);
        setJobToDelete(null);
        fetchAdminJobs();
      } else {
        alert(data.error || "No se pudo eliminar la oferta.");
      }
    } catch (err) {
      alert("Error al eliminar oferta.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==========================================
  // RENDER: LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Verificando credenciales de administrador...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN VIEW (IF NOT AUTHENTICATED)
  // ==========================================
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#07090e] text-[#ededed] flex flex-col justify-between p-4 sm:p-6 font-mono">
        <div className="max-w-md mx-auto w-full my-auto">
          <div className="bg-[#0d1117] border border-amber-400/30 p-8 shadow-2xl relative space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 border border-amber-400/50 bg-amber-400/10 flex items-center justify-center text-amber-400 mx-auto rounded-full">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Panel de Control Maestro
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Acceso restringido para el Administrador y Dueño de <strong>Geologgia Empleos</strong>.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs mb-1.5">
                  PIN O CLAVE MAESTRA
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/20 px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 text-sm tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting || !pinInput}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer disabled:opacity-50 text-xs shadow-lg uppercase tracking-wider"
              >
                {authSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Acceder al Panel de Control</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Portal Público</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-600">
          Geologgia Empleos · Control Seguro · Sesión Encriptada
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#07090e] text-[#ededed] font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161b26] border border-amber-400/50 text-white px-5 py-3 shadow-2xl flex items-center gap-3 font-mono text-xs animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / ADMIN HEADER */}
      <header className="border-b border-white/10 bg-[#0a0d14]/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-400 text-black font-black flex items-center justify-center text-xs">
            GL
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-sm flex items-center gap-2">
              <span>ADMINISTRADOR GEOLOGGIA</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-mono font-normal">
                SUPERADMIN
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Moderación directa de CVs, vacantes mineras y distinciones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-300 bg-[#161b26] border border-white/10 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[160px]">{adminEmail}</span>
          </span>

          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Portal Público</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cerrar Sesión de Administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* KPI STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
          <div className="p-4 bg-[#0d1117] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>POSTULANTES</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {candidateStats.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-400">{candidateStats.active} activos</span>
              <span>·</span>
              <span className="text-amber-400">{candidateStats.paused} dados de baja</span>
            </div>
          </div>

          <div className="p-4 bg-[#0d1117] border border-amber-400/30 bg-amber-400/[0.02] relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
              <span>ALUMNI UDEC</span>
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">
              {candidateStats.udec}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Perfiles preferentes con insignia
            </div>
          </div>

          <div className="p-4 bg-[#0d1117] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>CUPOS GRATIS</span>
              <Star className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {candidateStats.earlyBirdRemaining} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Early Birds disponibles
            </div>
          </div>

          <div className="p-4 bg-[#0d1117] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>OFERTAS LABORALES</span>
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {jobStats.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-400">{jobStats.active} activas</span>
              <span>·</span>
              <span className="text-slate-500">{jobStats.closed} cerradas</span>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex gap-2 font-mono text-xs">
            <button
              onClick={() => {
                setActiveTab("candidates");
                setSearchQuery("");
              }}
              className={`px-4 py-2 border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "candidates"
                  ? "bg-amber-400 text-black border-amber-400 font-bold"
                  : "bg-[#0d1117] text-slate-300 border-white/10 hover:border-white/30"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Postulantes & CVs ({candidates.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("jobs");
                setSearchQuery("");
              }}
              className={`px-4 py-2 border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-amber-400 text-black border-amber-400 font-bold"
                  : "bg-[#0d1117] text-slate-300 border-white/10 hover:border-white/30"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ofertas Laborales ({jobs.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === "candidates" ? "Buscar por nombre, correo, software..." : "Buscar por cargo, empresa, faena..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121620] border border-white/15 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: GESTIÓN DE POSTULANTES & CVs                          */}
        {/* ============================================================ */}
        {activeTab === "candidates" && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs bg-[#0d1117] p-3 border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-400" /> Estado:
                </span>
                <button
                  onClick={() => setCandidateStatusFilter("all")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    candidateStatusFilter === "all" ? "bg-white text-black font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Todos ({candidateStats.total})
                </button>
                <button
                  onClick={() => setCandidateStatusFilter("ACTIVE")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    candidateStatusFilter === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Activos ({candidateStats.active})
                </button>
                <button
                  onClick={() => setCandidateStatusFilter("PAUSED")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    candidateStatusFilter === "PAUSED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pausados / Baja ({candidateStats.paused})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCandidateUdecFilter(candidateUdecFilter === "udec" ? "all" : "udec")}
                  className={`px-3 py-1 text-[11px] border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    candidateUdecFilter === "udec"
                      ? "bg-amber-400 text-black border-amber-400 font-bold"
                      : "border-white/15 text-slate-300 hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Solo Alumni UdeC</span>
                </button>
              </div>
            </div>

            {/* Candidates Table / List */}
            {candidates.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1117] border border-white/10 font-mono text-xs text-slate-400">
                No se encontraron postulantes con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((cand) => {
                  const isPaused = cand.status === "PAUSED";
                  const isActing = actionLoadingId === cand.id;

                  return (
                    <div
                      key={cand.id}
                      className={`p-4 bg-[#0d1117] border transition-all ${
                        isPaused
                          ? "border-amber-500/30 bg-amber-500/[0.02] opacity-80"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Candidate Basic Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 font-mono">
                            <h3 className="font-bold text-white text-base">
                              {cand.fullName}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                                isPaused
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}
                            >
                              {isPaused ? "⏸️ Pausado (De baja)" : "🟢 Activo"}
                            </span>

                            {/* UdeC toggle button */}
                            <button
                              onClick={() => toggleCandidateUdec(cand)}
                              disabled={isActing}
                              title="Haz clic para activar o desactivar distinción UdeC"
                              className={`px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                                cand.isUdec
                                  ? "bg-amber-400/20 border-amber-400/50 text-amber-300 hover:bg-amber-400/30"
                                  : "bg-white/5 border-white/15 text-slate-400 hover:text-white"
                              }`}
                            >
                              <GraduationCap className="w-3 h-3 text-amber-400" />
                              <span>{cand.isUdec ? "Alumni UdeC ✓" : "Hacer UdeC"}</span>
                            </button>

                            {/* Early bird indicator */}
                            {cand.isEarlyBird && (
                              <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                Early Adopter
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 font-medium">
                            {cand.title} <span className="text-slate-500">·</span> {cand.university || "Universidad no especificada"} <span className="text-slate-500">·</span> {cand.yearsExp} años exp
                          </div>

                          <div className="text-xs text-slate-400 font-sans line-clamp-2 max-w-3xl leading-relaxed">
                            {cand.summary}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400 pt-1">
                            <span>📧 {cand.email}</span>
                            {cand.phone && <span>📞 {cand.phone}</span>}
                            <span>📍 {cand.preferredRegion} ({cand.preferredShift})</span>
                            <span className="text-slate-500">📅 {new Date(cand.createdAt).toLocaleDateString("es-CL")}</span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 font-mono text-xs">
                          {/* View CV PDF */}
                          {cand.cvUrl ? (
                            <a
                              href={cand.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-[#161b26] border border-white/15 hover:border-sky-400/60 text-sky-300 flex items-center gap-1.5 transition-colors"
                              title="Ver / Descargar PDF del CV"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver PDF</span>
                            </a>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] text-slate-600 border border-white/5">
                              Sin PDF
                            </span>
                          )}

                          {/* Toggle Active / Paused (Dar de baja) */}
                          <button
                            onClick={() => toggleCandidateStatus(cand)}
                            disabled={isActing}
                            className={`px-3 py-1.5 border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isPaused
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                                : "bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border-amber-400/40"
                            }`}
                            title={isPaused ? "Reactivar ficha en el portal público" : "Ocultar ficha del portal público"}
                          >
                            {isPaused ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Reactivar</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                <span>Dar de Baja</span>
                              </>
                            )}
                          </button>

                          {/* Delete permanently */}
                          <button
                            onClick={() => setCandidateToDelete(cand)}
                            disabled={isActing}
                            className="p-2 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar definitivamente de la base de datos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GESTIÓN DE OFERTAS LABORALES                         */}
        {/* ============================================================ */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs bg-[#0d1117] p-3 border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-emerald-400" /> Estado:
                </span>
                <button
                  onClick={() => setJobStatusFilter("all")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    jobStatusFilter === "all" ? "bg-white text-black font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Todas ({jobStats.total})
                </button>
                <button
                  onClick={() => setJobStatusFilter("ACTIVE")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    jobStatusFilter === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Activas ({jobStats.active})
                </button>
                <button
                  onClick={() => setJobStatusFilter("CLOSED")}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    jobStatusFilter === "CLOSED" ? "bg-slate-500/20 text-slate-300 border border-slate-500/40 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cerradas / Bajas ({jobStats.closed})
                </button>
              </div>

              <div className="text-slate-500 text-[11px]">
                {jobStats.featured} ofertas destacadas con estrella
              </div>
            </div>

            {/* Jobs List */}
            {jobs.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1117] border border-white/10 font-mono text-xs text-slate-400">
                No se encontraron ofertas laborales con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const isClosed = job.status === "CLOSED";
                  const isActing = actionLoadingId === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`p-4 bg-[#0d1117] border transition-all ${
                        isClosed
                          ? "border-slate-800 opacity-60"
                          : job.isFeatured
                          ? "border-amber-400/40 bg-amber-400/[0.02]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 font-mono">
                            <h3 className="font-bold text-white text-base">
                              {job.title}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                                isClosed
                                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}
                            >
                              {isClosed ? "Cerrada / Baja" : "Activa"}
                            </span>

                            {/* Featured toggle */}
                            <button
                              onClick={() => toggleJobFeatured(job)}
                              disabled={isActing}
                              className={`px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                                job.isFeatured
                                  ? "bg-amber-400 text-black border-amber-400 font-bold"
                                  : "bg-white/5 border-white/15 text-slate-400 hover:text-white"
                              }`}
                              title="Destacar o desmarcar oferta"
                            >
                              <Star className="w-3 h-3" />
                              <span>{job.isFeatured ? "Destacada ✓" : "Destacar"}</span>
                            </button>

                            <span className="px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30">
                              {job.category}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 font-medium">
                            {job.company} <span className="text-slate-500">·</span> {job.location} <span className="text-slate-500">·</span> {job.shift || "Turno estándar"} {job.salary ? `· ${job.salary}` : ""}
                          </div>

                          <div className="text-xs text-slate-400 font-sans line-clamp-2 max-w-3xl leading-relaxed">
                            {job.description}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 pt-1">
                            {job.applyEmail && <span>Postular: {job.applyEmail}</span>}
                            <span>Publicada: {new Date(job.createdAt).toLocaleDateString("es-CL")}</span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 font-mono text-xs">
                          {/* Toggle Active / Closed */}
                          <button
                            onClick={() => toggleJobStatus(job)}
                            disabled={isActing}
                            className={`px-3 py-1.5 border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isClosed
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/15"
                            }`}
                            title={isClosed ? "Reabrir vacante" : "Cerrar vacante y retirarla del portal"}
                          >
                            {isClosed ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Reabrir</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Dar de Baja</span>
                              </>
                            )}
                          </button>

                          {/* Delete Job permanently */}
                          <button
                            onClick={() => setJobToDelete(job)}
                            disabled={isActing}
                            className="p-2 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar oferta permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* CONFIRMATION MODAL: DELETE CANDIDATE                        */}
      {/* ============================================================ */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-rose-500/40 max-w-md w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">
                ¿Eliminar permanentemente a este postulante?
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Vas a purgar de forma irreversible el perfil, datos personales y archivo PDF de:
              <br />
              <strong className="text-white font-mono text-xs block mt-1">
                {candidateToDelete.fullName} ({candidateToDelete.email})
              </strong>
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteCandidate}
                disabled={actionLoadingId === candidateToDelete.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {actionLoadingId === candidateToDelete.id ? "Eliminando..." : "Sí, Eliminar de la BD"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONFIRMATION MODAL: DELETE JOB                              */}
      {/* ============================================================ */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-rose-500/40 max-w-md w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-white text-sm">
                ¿Eliminar permanentemente esta oferta laboral?
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Vas a borrar de forma permanente la vacante:
              <br />
              <strong className="text-white font-mono text-xs block mt-1">
                {jobToDelete.title} · {jobToDelete.company}
              </strong>
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteJob}
                disabled={actionLoadingId === jobToDelete.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {actionLoadingId === jobToDelete.id ? "Eliminando..." : "Sí, Eliminar Oferta"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
