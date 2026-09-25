"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import { type Aduan, type AduanStatus } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { formatSafeDate } from "@/lib/date";
import {
  ArrowLeft,
  Loader2,
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
} from "lucide-react";
import Link from "next/link";

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
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    VERIFIKASI: "bg-purple-100 text-purple-800 border-purple-300",
    PROSES: "bg-blue-100 text-blue-800 border-blue-300",
    SELESAI: "bg-emerald-100 text-emerald-800 border-emerald-300",
    DITOLAK: "bg-red-100 text-red-800 border-red-300",
  };
  const cls = map[status] ?? "bg-slate-100 text-slate-700 border-slate-300";

  const labelMap: Record<string, string> = {
    PENDING: "PENDING",
    VERIFIKASI: "VERIFIKASI",
    PROSES: "DIPROSES",
    SELESAI: "SELESAI",
    DITOLAK: "DITOLAK",
  };

  return (
    <span className={`${cls} px-2 py-0.5 rounded-full text-[11px] font-extrabold border`}>
      {labelMap[status] ?? status}
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
          .select("id, ticket_number, classification, status, created_at, updated_at, title, description, date_of_incident, location, institution, category, is_anonymous, name, email, phone, is_secret, response")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (isMounted) {
          setAduan(data);
          setStatus(data.status);
          setReplyContent((data as unknown as Record<string, string>).response || "");
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
      setAduan({ ...aduan, status });
      setReplyContent(normalizedResponse ?? "");

      // Refresh history timeline without full page reload
      await fetchHistory();

      setSaveFeedback({
        type: "success",
        message: "Status dan tanggapan resmi berhasil diperbarui.",
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

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case "PENGADUAN": return <span className="bg-[#1565C0] text-white font-extrabold px-3 py-1 rounded-md text-xs">PENGADUAN</span>;
      case "ASPIRASI": return <span className="bg-[#00838F] text-white font-extrabold px-3 py-1 rounded-md text-xs">ASPIRASI</span>;
      case "PERMINTAAN_INFORMASI": return <span className="bg-[#283593] text-white font-extrabold px-3 py-1 rounded-md text-xs">PERMINTAAN INFORMASI</span>;
      default: return null;
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1565C0]" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-2xl">
              <UserX className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mb-6">
            Akun Anda tidak memiliki hak akses administrator. Silakan hubungi pengelola sistem untuk mendapatkan izin akses.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  if (pageError || !aduan) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center space-y-4">
        <p className="font-bold">{pageError || "Aduan tidak ditemukan."}</p>
        <Link href="/admin" className="text-sm font-bold text-[#1565C0] hover:underline">
          Kembali ke Dashboard Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900 font-sans pb-12">
      <Link href="/admin" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#1565C0] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Daftar Aduan
      </Link>

      {/* ── Page-level layout ─────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* ──────────────────────────────────────────────────────────────────
            LEFT COLUMN: Report content, metadata, reporter info, attachments
            ────────────────────────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">

          {/* ── Card: Report Detail ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#90CAF9]/60 p-6 space-y-5">
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
                <Loader2 className="w-5 h-5 animate-spin text-[#1565C0]" />
                <span className="text-sm">Memuat lampiran...</span>
              </div>
            ) : attachmentsError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl font-medium">
                {attachmentsError}
              </div>
            ) : !attachments || attachments.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Tidak ada lampiran.</p>
            ) : (
              <div className="space-y-3">
                {attachments.map((att) => (
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
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-[#E3F2FD] hover:text-[#1565C0] hover:border-[#90CAF9] text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
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
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT COLUMN: Unified workflow card + Audit timeline
            ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Card: Tindak Lanjut Laporan (Unified Workflow) ─────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#1565C0]/30 p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-[#1565C0]" />
              <h3 className="font-bold text-[#0D47A1] text-sm uppercase tracking-wider">Tindak Lanjut Laporan</h3>
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
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm resize-none"
              />
            </div>

            {/* Inline save feedback */}
            {saveFeedback.type !== "idle" && (
              <FeedbackBanner
                feedback={saveFeedback}
                onDismiss={() => setSaveFeedback({ type: "idle" })}
              />
            )}

            {/* Submit action */}
            <button
              onClick={handleSaveTindakLanjut}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-extrabold px-6 py-3 rounded-xl shadow-sm transition-colors text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? "Menyimpan..." : "Simpan & Perbarui"}
            </button>
          </div>

          {/* ── Card: Riwayat Penanganan (Audit Trail) ─────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#90CAF9]/60 p-6">
            <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
              <History className="w-4 h-4 text-[#1565C0]" />
              <h3 className="font-bold text-[#0D47A1] text-sm uppercase tracking-wider">Riwayat Penanganan</h3>
            </div>

            {historyLoading ? (
              <div className="flex items-center gap-3 text-slate-500 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#1565C0]" />
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
