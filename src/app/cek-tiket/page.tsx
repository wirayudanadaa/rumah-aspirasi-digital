"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { type AduanPublicTrack } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusStepper } from "@/components/StatusStepper";
import { Search, Loader2, AlertCircle, MessageCircle, SearchX, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { formatSafeDate } from "@/lib/date";
import { parseSafeJsonResponse } from "@/lib/http";

interface TrackingErrorState {
  type: "not_found" | "server_error" | "rate_limit" | "validation";
  title: string;
  message: string;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get("ticket");

  // Initialize state directly from URL parameter
  const [ticket, setTicket] = useState(ticketParam ? ticketParam.trim().toUpperCase() : "");
  const [prevTicketParam, setPrevTicketParam] = useState(ticketParam);

  const [loading, setLoading] = useState(false);
  const [aduan, setAduan] = useState<AduanPublicTrack | null>(null);
  const [errorState, setErrorState] = useState<TrackingErrorState | null>(null);

  // Render-phase state sync: perfectly safe React pattern to avoid setState-in-effect
  if (ticketParam !== prevTicketParam) {
    setPrevTicketParam(ticketParam);
    const normalized = ticketParam ? ticketParam.trim().toUpperCase() : "";
    setTicket(normalized);
  }

  const performSearch = useCallback(async (searchTicket: string) => {
    const cleanTicket = searchTicket.trim().toUpperCase();
    if (!cleanTicket) return;

    setLoading(true);
    setErrorState(null);
    setAduan(null);

    try {
      const res = await fetch("/api/cek-tiket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: cleanTicket }),
      });

      const { data: json, isJson } = await parseSafeJsonResponse<{
        success?: boolean;
        data?: AduanPublicTrack;
        message?: string;
        code?: string;
      }>(res);

      if (!res.ok) {
        if (res.status === 404 || json?.code === "NOT_FOUND") {
          setErrorState({
            type: "not_found",
            title: "Nomor Tiket Tidak Ditemukan",
            message: json?.message || "Nomor tiket tidak ditemukan. Silakan periksa kembali kode Anda dan pastikan tidak ada kesalahan ketik atau spasi ekstra.",
          });
        } else if (res.status === 429 || json?.code === "RATE_LIMITED") {
          setErrorState({
            type: "rate_limit",
            title: "Batas Pengecekan Tercapai",
            message: json?.message || "Batas frekuensi pengecekan tiket telah tercapai. Silakan coba kembali beberapa saat lagi.",
          });
        } else if (res.status === 400 || json?.code === "BAD_REQUEST") {
          setErrorState({
            type: "validation",
            title: "Format Tiket Tidak Sesuai",
            message: json?.message || "Format nomor tiket tidak valid. Contoh format yang benar: TKT-123456-ABCD.",
          });
        } else {
          // 500, 502, 503, non-JSON HTML, or empty error
          setErrorState({
            type: "server_error",
            title: "Gangguan Sistem Sementara",
            message: isJson && json?.message ? json.message : "Sistem pelacakan sedang mengalami kendala internal. Data laporan Anda tetap aman. Silakan coba beberapa saat lagi.",
          });
        }
        return;
      }

      if (json?.data) {
        setAduan(json.data as AduanPublicTrack);
      } else {
        setErrorState({
          type: "not_found",
          title: "Nomor Tiket Tidak Ditemukan",
          message: "Data laporan untuk nomor tiket tersebut tidak tersedia.",
        });
      }
    } catch (err: unknown) {
      console.error("[Cek Tiket Network Error]:", err);
      setErrorState({
        type: "server_error",
        title: "Koneksi Terputus",
        message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Guard ref to ensure we don't duplicate API calls on StrictMode or rapid re-renders
  const hasAutoSearchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (ticketParam) {
      const normalized = ticketParam.trim().toUpperCase();
      if (hasAutoSearchedRef.current !== normalized) {
        hasAutoSearchedRef.current = normalized;
        performSearch(normalized);
      }
    }
  }, [ticketParam, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = ticket.trim().toUpperCase();
    hasAutoSearchedRef.current = normalized;
    performSearch(normalized);
  };

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case "PENGADUAN": return <span className="bg-[#1565C0] text-white font-extrabold px-3 py-1 rounded-full text-xs">PENGADUAN</span>;
      case "ASPIRASI": return <span className="bg-[#00838F] text-white font-extrabold px-3 py-1 rounded-full text-xs">ASPIRASI</span>;
      case "PERMINTAAN_INFORMASI": return <span className="bg-[#283593] text-white font-extrabold px-3 py-1 rounded-full text-xs">PERMINTAAN INFORMASI</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Search Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-8 mb-8 text-center space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0D47A1] mb-2">Lacak Laporan Rumah Aspirasi</h1>
          <p className="text-slate-500 text-sm">Masukkan Kode Tracking ID / Nomor Tiket laporan untuk melihat status perkembangan terkini</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ticket}
              maxLength={50}
              onChange={(e) => {
                setTicket(e.target.value.toUpperCase().trimStart());
                if (errorState) setErrorState(null);
              }}
              placeholder="Contoh: TKT-123456-ABCD"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-black font-semibold text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ticket.trim()}
            className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LACAK"}
          </button>
        </form>

        {errorState && (
          <div
            className={`p-5 rounded-2xl border text-sm text-left transition-all ${
              errorState.type === "not_found"
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : errorState.type === "rate_limit"
                ? "bg-orange-50/80 border-orange-200 text-orange-900"
                : errorState.type === "validation"
                ? "bg-blue-50/80 border-blue-200 text-blue-900"
                : "bg-red-50/80 border-red-200 text-red-900"
            }`}
            role="alert"
          >
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 mt-0.5">
                {errorState.type === "not_found" ? (
                  <SearchX className="w-5 h-5 text-amber-600" aria-hidden="true" />
                ) : errorState.type === "rate_limit" ? (
                  <Clock className="w-5 h-5 text-orange-600" aria-hidden="true" />
                ) : errorState.type === "validation" ? (
                  <AlertCircle className="w-5 h-5 text-[#1565C0]" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-bold text-sm leading-snug">
                  {errorState.title}
                </div>
                <p className="text-xs leading-relaxed opacity-90 font-medium">
                  {errorState.message}
                </p>
                {errorState.type === "server_error" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => performSearch(ticket)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aduan Result Detail or Empty State */}
      {aduan ? (
        <div className="bg-white rounded-3xl shadow-lg border border-[#90CAF9]/60 p-6 md:p-8 space-y-8">
          
          {/* Header info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {getClassificationBadge(aduan.classification)}
              <span className="text-xs font-mono font-bold text-slate-600 bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#90CAF9]/40">
                #{aduan.ticket_number}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Dilaporkan: {formatSafeDate(aduan.created_at, "dd MMMM yyyy, HH:mm")}
            </div>
          </div>

          {/* Stepper Progress */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Progres Penanganan</h3>
            <StatusStepper status={aduan.status} />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{aduan.title}</h2>
          </div>

          {/* Balasan Resmi Admin jika ada */}
          {aduan.response && (
            <div className="bg-[#E3F2FD] border border-[#90CAF9] p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-sm">
                <MessageCircle className="w-5 h-5 text-[#1565C0]" />
                Tindak Lanjut & Balasan Resmi Instansi:
              </div>
              <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {aduan.response}
              </div>
              {aduan.updated_at && (
                <div className="text-xs text-slate-500 pt-2 border-t border-[#90CAF9]/50">
                  Ditindaklanjuti pada: {formatSafeDate(aduan.updated_at, "dd MMMM yyyy, HH:mm")}
                </div>
              )}
            </div>
          )}
        </div>
      ) : !loading && !errorState && (
        <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#E3F2FD] text-[#1565C0] rounded-full flex items-center justify-center mx-auto mb-2">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#0D47A1]">Apa itu Nomor Tiket?</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nomor Tiket atau Kode Tracking adalah identitas unik (contoh: <strong>TKT-123456-ABCD</strong>) yang Anda dapatkan setelah berhasil mengirimkan laporan pengaduan atau aspirasi.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Masukkan kode tersebut di atas untuk memantau status penanganan, melihat tindak lanjut dari instansi, dan membaca balasan resmi.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CekTiketPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <Navbar />
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1565C0]" />
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
