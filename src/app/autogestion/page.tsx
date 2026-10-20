"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Shield,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  FileText,
  Trash2,
  ShieldAlert
} from "lucide-react";

function AutogestionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Form states
  const [preferredShift, setPreferredShift] = useState("7x7");
  const [preferredRegion, setPreferredRegion] = useState("");
  const [summary, setSummary] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (!token) {
      setError("No se proporcionó un token de gestión válido.");
      setLoading(false);
      return;
    }

    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/candidates/manage?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.success && data.candidate) {
          setCandidate(data.candidate);
          setPreferredShift(data.candidate.preferredShift || "7x7");
          setPreferredRegion(data.candidate.preferredRegion || "");
          setSummary(data.candidate.summary || "");
          setPhone(data.candidate.phone || "");
          setEmail(data.candidate.email || "");
          setStatus(data.candidate.status || "ACTIVE");
        } else {
          setError(data.error || "Perfil no encontrado o enlace caducado.");
        }
      } catch (e) {
        setError("Error al cargar los datos del perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [token]);

  const handleUpdate = async (newStatus?: string) => {
    setSaving(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/candidates/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          status: newStatus || status,
          preferredShift,
          preferredRegion,
          summary,
          phone,
          email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus) setStatus(newStatus);
        setSuccessMessage(data.message || "Cambios guardados exitosamente.");
      } else {
        alert(data.error || "Error al actualizar");
      }
    } catch (e) {
      alert("Error de conexión al guardar cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/candidates/manage?token=${encodeURIComponent(token || "")}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleted(true);
        // Clear local storage if it was the current user
        localStorage.removeItem("geologgia_user_email");
        localStorage.removeItem("geologgia_verified_token");
      } else {
        alert(data.error || "No se pudo eliminar el perfil.");
      }
    } catch (e) {
      alert("Error de conexión al procesar la supresión de datos.");
    } finally {
      setDeleting(false);
    }
  };

  if (isDeleted) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-[#0d1117] border border-emerald-500/30 p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Perfil y Datos Eliminados</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conforme a la Ley N° 19.628 y la Nueva Ley de Protección de Datos Personales de Chile, tu currículum, datos de contacto y registro han sido borrados de forma permanente e irrecuperable de nuestros servidores (Derecho al Olvido).
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Geologgia Empleos</span>
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Verificando credenciales de gestión...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-[#0d1117] border border-red-500/30 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Acceso no autorizado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Portal</span>
          </a>
        </div>
      </div>
    );
  }

  const isPaused = status === "PAUSED";

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header link */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Directorio de Empleos</span>
        </a>

        {/* Status Notification */}
        {successMessage && (
          <div className="bg-[#0d1117] border border-emerald-500/40 text-emerald-300 p-4 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#0d1117] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                  // PANEL DE AUTOGESTIÓN
                </span>
                {candidate.isUdec && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    🎓 Alumni UdeC
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {candidate.fullName}
              </h1>
              <p className="text-xs font-mono text-sky-400 mt-0.5">{candidate.title}</p>
            </div>

            {/* Quick Toggle Status */}
            <div>
              {isPaused ? (
                <button
                  onClick={() => handleUpdate("ACTIVE")}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold transition-all shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reactivar mi Perfil</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdate("PAUSED")}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 font-mono text-xs font-semibold transition-all"
                  title="Pausar perfil cuando ya encontraste trabajo"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Pausar Perfil (Ya tengo pega)</span>
                </button>
              )}
            </div>
          </div>

          {/* Visibility Banner */}
          <div
            className={`p-4 border font-mono text-xs ${
              isPaused
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            {isPaused ? (
              <p>
                ⚠️ <strong>Perfil PAUSADO:</strong> Tu CV y datos están ocultos en el directorio. Ningún reclutador verá tu ficha hasta que lo reactives.
              </p>
            ) : (
              <p>
                ✅ <strong>Perfil ACTIVO:</strong> Tu ficha está visible para empresas y colegas del rubro minero en Chile.
              </p>
            )}
          </div>

          {/* Form to update Shift & Contact */}
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Turno Preferido</label>
                <input
                  type="text"
                  value={preferredShift}
                  onChange={(e) => setPreferredShift(e.target.value)}
                  placeholder="ej. 7x7, 4x3, 5x2"
                  className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/70"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Región / Ubicación</label>
                <input
                  type="text"
                  value={preferredRegion}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  placeholder="ej. Antofagasta / Todo Chile"
                  className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+569..."
                  className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/70"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Resumen Profesional</label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-[#161b26] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/70 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleUpdate()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Zona de Protección de Datos y Derecho al Olvido (Ley N° 19.628 / Nueva Ley de Datos Personales de Chile) */}
        <div className="bg-[#0d1117] border border-rose-500/20 p-6 font-mono text-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="font-bold uppercase tracking-wider text-[11px]">
              Zona de Privacidad & Derecho al Olvido (Legislación Chilena)
            </h4>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Conforme a la <strong>Ley N° 19.628</strong> sobre Protección de la Vida Privada y la <strong>Nueva Ley de Protección de Datos Personales de Chile</strong>, tú eres el único dueño de tu información. Puedes eliminar de forma inmediata, definitiva e irreversible todos tus antecedentes y currículum de nuestros servidores.
          </p>

          {showDeleteConfirm ? (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded space-y-3">
              <p className="text-rose-200 font-bold">
                ⚠️ ¿Estás completamente seguro(a)? Esta acción borrará permanentemente tu ficha y tu CV adjunto. No se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="px-4 py-1.5 bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? "Borrando definitivamente..." : "Sí, borrar todos mis datos"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-slate-500">
                Cancelación total de registro
              </span>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ejercer Derecho al Olvido (Eliminar Perfil)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AutogestionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center font-mono text-xs">
          Cargando...
        </div>
      }
    >
      <AutogestionContent />
    </Suspense>
  );
}
