"use client";

import { useEffect, useState, use, useCallback, useMemo, useRef } from "react";
import { type Aduan, type AduanStatus } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { formatSafeDate } from "@/lib/date";
import { CrystalLoader } from "@/components/ui/CrystalLoader";
import {
  ArrowLeft,
  // Loader2,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Building2,
  MapPin,
  Tag,
  UserX,
  Lock,
  Send,
  History,
  ArrowRight,
  Paperclip,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Table,
  Image as ImageIcon,
  X
} from "lucide-react";
import Link from "next/link";
import { exportSinglePDF, exportSingleXLSX } from "@/lib/exportUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AduanHistory {
  id: string;
  aduan_id: string;
  action: string;
  old_status: string | null;
  new_status: string;
  old_response: string | null;
  new_response: string | null;
  changed_by: string | null;
  created_at: string;
}

interface AduanAttachment {
  id: string;
  aduan_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

type FeedbackState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ─── Inline Feedback Banner ───────────────────────────────────────────────────

function FeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: FeedbackState;
  onDismiss: () => void;
}) {
  if (feedback.type === "idle") return null;

  const isSuccess = feedback.type === "success";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
        isSuccess
          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
          : "bg-red-50 border-red-300 text-red-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
      )}
      <span className="flex-1">{feedback.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity ml-2"
        aria-label="Tutup pesan"
      >
        ×
      </button>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    PENDING: "bg-amber-500",
    VERIFIKASI: "bg-purple-500",
    PROSES: "bg-blue-500",
    SELESAI: "bg-emerald-500",
    DITOLAK: "bg-rose-500",
  };
  const badgeStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200/70",
    VERIFIKASI: "bg-purple-50 text-purple-700 border-purple-200/70",
    PROSES: "bg-blue-50 text-blue-700 border-blue-200/70",
    SELESAI: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    DITOLAK: "bg-rose-50 text-rose-700 border-rose-200/70",
  };
  const labelMap: Record<string, string> = {
    PENDING: "PENDING",
    VERIFIKASI: "VERIFIKASI",
    PROSES: "DIPROSES",
    SELESAI: "SELESAI",
    DITOLAK: "DITOLAK",
  };

  const dot = dotColor[status] ?? "bg-slate-400";
  const cls = badgeStyle[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
  const label = labelMap[status] ?? status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────

function TimelineEntry({ entry, isLast }: { entry: AduanHistory; isLast: boolean }) {
  const actor =
    entry.changed_by !== null
      ? "Admin"
      : entry.action === "CREATED"
      ? "Pelapor"
      : "Riwayat awal";

  const dotColor: Record<string, string> = {
    CREATED: "bg-emerald-500",
    INITIAL_SNAPSHOT: "bg-slate-400",
    STATUS_CHANGED: "bg-[#1565C0]",
    RESPONSE_UPDATED: "bg-amber-500",
    UPDATED: "bg-purple-500",
  };

  const dot = dotColor[entry.action] ?? "bg-slate-400";

  let title = "";
  let body: React.ReactNode = null;

  switch (entry.action) {
    case "CREATED":
      title = "Laporan diterima";
      body = (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-xs">Status awal:</span>
          <StatusBadge status={entry.new_status} />
        </div>
      );
      break;
    case "INITIAL_SNAPSHOT":
      title = "Riwayat awal";
      body = (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-xs">Status tercatat:</span>
          <StatusBadge status={entry.new_status} />
        </div>
      );
      break;
    case "STATUS_CHANGED":
      title = "Status diperbarui";
      body = (
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={entry.old_status ?? "-"} />
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <StatusBadge status={entry.new_status} />
        </div>
      );
      break;
    case "RESPONSE_UPDATED":
      title = "Tanggapan diperbarui";
      body = entry.new_response ? (
        <p className="text-slate-600 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl leading-relaxed line-clamp-3">
          {entry.new_response}
        </p>
      ) : null;
      break;
    case "UPDATED":
      title = "Status & tanggapan diperbarui";
      body = (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={entry.old_status ?? "-"} />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <StatusBadge status={entry.new_status} />
          </div>
          {entry.new_response && (
            <p className="text-slate-600 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl leading-relaxed line-clamp-3">
              {entry.new_response}
            </p>
          )}
        </div>
      );
      break;
    default:
      title = entry.action;
  }

  return (
    <div className="flex gap-4">
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${dot}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1.5" />}
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-bold text-slate-800">{title}</span>
          <span className="text-[10px] font-medium text-slate-400 shrink-0">{actor}</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">
          {formatSafeDate(entry.created_at, "dd MMMM yyyy, HH:mm")}
        </p>
        {body}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAduanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);

  const [aduan, setAduan] = useState<Aduan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AduanStatus>("PENDING");
  const [replyContent, setReplyContent] = useState("");
  const [pageError, setPageError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  // Feedback replaces native alert()
  const [saveFeedback, setSaveFeedback] = useState<FeedbackState>({ type: "idle" });
  const [attachmentFeedback, setAttachmentFeedback] = useState<FeedbackState>({ type: "idle" });

  const [adminAttachment, setAdminAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  const [history, setHistory] = useState<AduanHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [attachments, setAttachments] = useState<AduanAttachment[] | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState("");

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const { data, error: histErr } = await supabase
        .from("aduan_history")
        .select("id, aduan_id, action, old_status, new_status, old_response, new_response, changed_by, created_at")
        .eq("aduan_id", id)
        .order("created_at", { ascending: false });

      if (histErr) throw histErr;
      setHistory((data as AduanHistory[]) ?? []);
    } catch {
      console.error("[HISTORY FETCH ERROR]");
      setHistoryError("Gagal memuat riwayat penanganan.");
    } finally {
      setHistoryLoading(false);
    }
  }, [id, supabase]);

  // ── Fetch attachments ──────────────────────────────────────────────────────
  const fetchAttachments = useCallback(async () => {
    setAttachmentsLoading(true);
    setAttachmentsError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // LOG-01: Removed debug log leaking routeId and userId

      if (!user) {
        setAttachmentsError("Tidak terautentikasi.");
        return;
      }

      const { data, error: attErr } = await supabase
        .from("aduan_attachments")
        .select("id, aduan_id, file_name, storage_path, mime_type, file_size, created_at")
        .eq("aduan_id", id)
        .order("created_at", { ascending: false });

      if (attErr) throw attErr;

      // LOG-01: Removed attachment count debug log
      setAttachments((data as AduanAttachment[]) ?? []);
    } catch {
      console.error("[ATTACHMENTS FETCH ERROR]");
      setAttachmentsError("Gagal memuat lampiran.");
    } finally {
      setAttachmentsLoading(false);
    }
  }, [id, supabase]);

  // ── Fetch aduan ────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchAduan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setPageError("Sesi tidak ditemukan. Silakan login kembali.");
            setLoading(false);
          }
          return;
        }

        // Layer 1 authorization check on the client explicitly
        const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', {
          target_user_id: user.id
        });

        if (rpcError || !isAdmin) {
          if (isMounted) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("aduan")
          .select("id, ticket_number, classification, status, created_at, updated_at, title, description, date_of_incident, location, institution, category, is_anonymous, name, email, is_secret, response")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (isMounted) {
          setAduan(data);
          setStatus(data.status);
          setReplyContent(data.response || "");
          setLoading(false);
        }
      } catch {
        console.error("Error fetching aduan details");
        if (isMounted) {
          setPageError("Data aduan tidak ditemukan atau Anda tidak memiliki akses.");
          setLoading(false);
        }
      }
    };

    fetchAduan();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch history separately so setState calls don't cascade inside the aduan effect
  useEffect(() => {
    void (async () => {
      await Promise.all([
        fetchHistory(),
        fetchAttachments()
      ]);
    })();
  }, [fetchHistory, fetchAttachments]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleViewAttachment = async (path: string, download: boolean = false) => {
    setAttachmentFeedback({ type: "idle" });
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .createSignedUrl(path, 60, { download });

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch {
      console.error("[SIGNED URL ERROR]");
      setAttachmentFeedback({
        type: "error",
        message: "Gagal membuka lampiran. Silakan coba lagi.",
      });
    }
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSaveTindakLanjut = async () => {
    if (!aduan) return;
    setSaving(true);
    setSaveFeedback({ type: "idle" });

    // Handle Upload First if exists
    if (adminAttachment) {
      const uploadFormData = new FormData();
      uploadFormData.append("attachment", adminAttachment);

      try {
        const uploadRes = await fetch(`/api/admin/aduan/${aduan.id}/attachment`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.message || "Gagal mengunggah lampiran.");
        }
        
        setAdminAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: unknown) {
        console.error("[ADMIN UPLOAD ERROR]", err);
        const errMsg = err instanceof Error ? err.message : "Gagal mengunggah lampiran.";
        setSaveFeedback({ type: "error", message: errMsg });
        setSaving(false);
        return; // stop execution if upload fails
      }
    }

    // Normalize response: empty string → NULL
    const normalizedResponse = replyContent.trim() === "" ? null : replyContent.trim();

    try {
      const { error } = await supabase
        .from("aduan")
        .update({
          status,
          response: normalizedResponse,
          updated_at: new Date().toISOString(),
        })
        .eq("id", aduan.id);

      if (error) throw error;

      // Update local aduan state
      setAduan(prev => prev ? {
        ...prev,
        status,
        response: normalizedResponse,
        updated_at: new Date().toISOString()
      } : null);
      setReplyContent(normalizedResponse ?? "");

      // Refresh history timeline & attachments
      await Promise.all([
        fetchHistory(),
        fetchAttachments()
      ]);

      setSaveFeedback({
        type: "success",
        message: adminAttachment ? "Tanggapan dan lampiran berhasil diperbarui." : "Status dan tanggapan resmi berhasil diperbarui.",
      });
    } catch {
      console.error("[ADMIN UPDATE ERROR]");
      setSaveFeedback({
        type: "error",
        message: "Gagal memperbarui data laporan. Periksa koneksi Anda dan coba lagi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!aduan) return;
    setExportingPDF(true);
    try {
      exportSinglePDF(aduan, history);
      setSaveFeedback({ type: "success", message: "PDF berhasil dibuat" });
    } catch (error) {
      console.error(error);
      setSaveFeedback({ type: "error", message: "Gagal membuat file PDF. Silakan coba lagi." });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportXLSX = async () => {
    if (!aduan) return;
    setExportingXLSX(true);
    try {
      exportSingleXLSX(aduan, history);
      setSaveFeedback({ type: "success", message: "XLSX berhasil dibuat" });
    } catch (error) {
      console.error(error);
      setSaveFeedback({ type: "error", message: "Gagal membuat file XLSX. Silakan coba lagi." });
    } finally {
      setExportingXLSX(false);
    }
  };

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case "PENGADUAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Pengaduan
          </span>
        );
      case "ASPIRASI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
            Aspirasi
          </span>
        );
      case "PERMINTAAN_INFORMASI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Permintaan Informasi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
            Lainnya
          </span>
        );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <CrystalLoader size={32} className="text-blue-600" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
              <UserX className="w-8 h-8 text-rose-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mb-6">
            Akun Anda tidak memiliki hak akses administrator. Silakan hubungi pengelola sistem untuk mendapatkan izin akses.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-2xs text-sm"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  if (pageError || !aduan) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-2xs max-w-md mx-auto">
        <p className="font-semibold text-slate-800">{pageError || "Aduan tidak ditemukan."}</p>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard Admin</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900 font-sans pb-12">
      <Link 
        href="/admin" 
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" />
        <span>Kembali ke Daftar Laporan</span>
      </Link>

      {/* ── Page-level layout ─────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* ──────────────────────────────────────────────────────────────────
            LEFT COLUMN: Report content, metadata, reporter info, attachments
            ────────────────────────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">

          {/* ── Card: Report Detail ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 space-y-5">
            {/* Header row: classification + ticket + date */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                {getClassificationBadge(aduan.classification)}
                <span className="font-mono font-bold text-[#0D47A1] text-xs bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#90CAF9]/40">
                  #{aduan.ticket_number}
                </span>
                <StatusBadge status={aduan.status} />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {formatSafeDate(aduan.created_at, "dd MMMM yyyy, HH:mm")}
              </div>
            </div>

            {/* Title + description */}
            <div>
              <h1 className="text-xl font-black text-slate-900 mb-3">{aduan.title}</h1>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-[#E3F2FD]/30 p-5 rounded-2xl border border-[#90CAF9]/40 text-sm">
                {aduan.description}
              </p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1565C0]" /> Tanggal Kejadian
                </span>
                <span className="font-semibold text-slate-900">
                  {formatSafeDate(aduan.date_of_incident, "dd MMM yyyy", { fallback: "–" })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1565C0]" /> Lokasi Kejadian
                </span>
                <span className="font-semibold text-slate-900">{aduan.location || "–"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1565C0]" /> Instansi Tujuan
                </span>
                <span className="font-semibold text-slate-900">{aduan.institution || "–"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Tag className="w-3.5 h-3.5 text-[#1565C0]" /> Kategori
                </span>
                <span className="font-semibold text-slate-900">{aduan.category || "–"}</span>
              </div>
            </div>
          </div>

          {/* ── Card: Informasi Pelapor ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#90CAF9]/60 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-100">
              Informasi Pelapor
            </h3>

            {aduan.is_anonymous ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-semibold">
                <UserX className="w-5 h-5 shrink-0" />
                <span>Pelapor memilih opsi <strong>ANONIM</strong>. Identitas disembunyikan.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E3F2FD] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#1565C0]" />
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Nama Pelapor</div>
                    <div className="font-bold text-slate-900 text-sm">{aduan.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E3F2FD] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#1565C0]" />
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Email</div>
                    <div className="font-bold text-slate-900">{aduan.email}</div>
                  </div>
                </div>
              </div>
            )}

            {aduan.is_secret && (
              <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center gap-2 text-slate-700 text-xs font-semibold">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Laporan ini bersifat <strong>RAHASIA</strong>.</span>
              </div>
            )}
          </div>

          {/* ── Card: Lampiran ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#90CAF9]/60 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Paperclip className="w-4 h-4 text-[#1565C0]" />
              <h3 className="font-bold text-[#0D47A1] text-sm uppercase tracking-wider">Lampiran</h3>
            </div>

            {/* Attachment-level error feedback */}
            {attachmentFeedback.type !== "idle" && (
              <FeedbackBanner
                feedback={attachmentFeedback}
                onDismiss={() => setAttachmentFeedback({ type: "idle" })}
              />
            )}

            {attachmentsLoading ? (
              <div className="flex items-center gap-3 text-slate-500 py-2">
                <CrystalLoader size={20} className="text-[#1565C0]" />
                <span className="text-sm">Memuat lampiran...</span>
              </div>
            ) : attachmentsError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl font-medium">
                {attachmentsError}
              </div>
            ) : !attachments || attachments.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Tidak ada lampiran.</p>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const citizenAtts = attachments.filter(a => !a.storage_path.includes("/admin/"));
                  const adminAtts = attachments.filter(a => a.storage_path.includes("/admin/"));
                  
                  return (
                    <>
                      {citizenAtts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1">
                            Lampiran Pelapor
                          </h4>
                          {citizenAtts.map((att) => (
                            <div
                              key={att.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl"
                            >
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-sm text-slate-900 truncate">{att.file_name}</span>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span>{formatBytes(att.file_size)}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span className="truncate max-w-[120px] sm:max-w-none">{att.mime_type}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span>{formatSafeDate(att.created_at, "dd MMM yyyy, HH:mm")}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleViewAttachment(att.storage_path, false)}
                                  className="px-3 py-1.5 bg-white border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Lihat
                                </button>
                                <button
                                  onClick={() => handleViewAttachment(att.storage_path, true)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Unduh
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {adminAtts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1 mt-2">
                            Lampiran Tanggapan / Admin
                          </h4>
                          {adminAtts.map((att) => (
                            <div
                              key={att.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200/60 p-4 rounded-xl"
                            >
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-sm text-slate-900 truncate">{att.file_name}</span>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span>{formatBytes(att.file_size)}</span>
                                  <span className="w-1 h-1 rounded-full bg-blue-300" />
                                  <span className="truncate max-w-[120px] sm:max-w-none">{att.mime_type}</span>
                                  <span className="w-1 h-1 rounded-full bg-blue-300" />
                                  <span>{formatSafeDate(att.created_at, "dd MMM yyyy, HH:mm")}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleViewAttachment(att.storage_path, false)}
                                  className="px-3 py-1.5 bg-white border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Lihat
                                </button>
                                <button
                                  onClick={() => handleViewAttachment(att.storage_path, true)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Unduh
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT COLUMN: Unified workflow card + Audit timeline
            ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Card: Tindak Lanjut Laporan (Unified Workflow) ─────────── */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Tindak Lanjut Laporan</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {exportingPDF ? <CrystalLoader size={12} className="text-red-600" /> : <FileText className="w-3.5 h-3.5" />}
                  {exportingPDF ? "Exporting..." : "Export PDF"}
                </button>
                <button
                  onClick={handleExportXLSX}
                  disabled={exportingXLSX}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {exportingXLSX ? <CrystalLoader size={12} className="text-green-700" /> : <Table className="w-3.5 h-3.5" />}
                  {exportingXLSX ? "Exporting..." : "Export XLSX"}
                </button>
              </div>
            </div>

            {/* Current status display */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Saat Ini</div>
              <StatusBadge status={aduan.status} />
            </div>

            {/* New status selector */}
            <div>
              <label
                htmlFor="status-select"
                className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5"
              >
                Perbarui Status
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as AduanStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PENDING">PENDING — Baru Masuk</option>
                <option value="VERIFIKASI">VERIFIKASI — Sedang Diverifikasi</option>
                <option value="PROSES">PROSES — Sedang Ditindaklanjuti</option>
                <option value="SELESAI">SELESAI — Laporan Ditutup</option>
                <option value="DITOLAK">DITOLAK — Tidak Valid</option>
              </select>
            </div>

            {/* Official response textarea */}
            <div>
              <label
                htmlFor="response-textarea"
                className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5"
              >
                Tanggapan Resmi Instansi
              </label>
              <textarea
                id="response-textarea"
                rows={5}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Ketik tanggapan atau perkembangan penanganan laporan..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 text-sm resize-none"
              />
            </div>

            {/* Inline save feedback */}
            {saveFeedback.type !== "idle" && (
              <FeedbackBanner
                feedback={saveFeedback}
                onDismiss={() => setSaveFeedback({ type: "idle" })}
              />
            )}

            {/* Admin Attachment Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Lampiran Tanggapan (Opsional)
                </label>
              </div>
              
              {!adminAttachment ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-colors group"
                >
                  <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  <div className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">
                    Pilih Lampiran
                    <span className="block text-[10px] font-normal text-slate-400 group-hover:text-blue-400/70 mt-0.5">
                      PDF, DOCX, PNG, JPG, JPEG • max 2MB
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setSaveFeedback({ type: "error", message: `Ukuran file melebihi batas 2 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).` });
                        return;
                      }
                      const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp"];
                      if (!allowed.includes(file.type) && !file.name.endsWith('.docx')) {
                        setSaveFeedback({ type: "error", message: "Format file tidak didukung." });
                        return;
                      }
                      setSaveFeedback({ type: "idle" });
                      setAdminAttachment(file);
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200/60 rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-xs border border-blue-100">
                      {adminAttachment.type.includes("image") ? (
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-700 truncate">
                        {adminAttachment.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(adminAttachment.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAdminAttachment(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors shrink-0"
                    title="Hapus lampiran"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit action */}
            <button
              onClick={handleSaveTindakLanjut}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-2xs transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <CrystalLoader size={16} /> : <Send className="w-4 h-4" />}
              {saving ? (adminAttachment ? "Menyimpan & Mengunggah..." : "Menyimpan...") : "Simpan & Perbarui"}
            </button>
          </div>

          {/* ── Card: Riwayat Penanganan (Audit Trail) ─────────────────── */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6">
            <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Riwayat Penanganan</h3>
            </div>

            {historyLoading ? (
              <div className="flex items-center gap-3 text-slate-500 py-4">
                <CrystalLoader size={20} className="text-blue-600" />
                <span className="text-sm">Memuat riwayat...</span>
              </div>
            ) : historyError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl font-medium">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Tidak ada riwayat penanganan.</p>
            ) : (
              <div>
                {history.map((entry, idx) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isLast={idx === history.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
