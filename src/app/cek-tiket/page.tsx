"use client";

import { useState } from "react";
import { supabase, type AduanPublicTrack } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { StatusStepper } from "@/components/StatusStepper";
import { Search, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function CekTiketPage() {
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [aduan, setAduan] = useState<AduanPublicTrack | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.trim()) return;

    setLoading(true);
    setError("");
    setAduan(null);

    try {
      const { data, error } = await supabase
        .rpc("get_aduan_by_ticket", { p_ticket_number: ticket.trim() })
        .single();

      if (error) throw error;
      setAduan(data as AduanPublicTrack);
    } catch (err: unknown) {
      console.error(err);
      setError("Nomor Tiket / Tracking ID tidak ditemukan. Pastikan kode yang dimasukkan sudah benar.");
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Navbar />

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
                onChange={(e) => setTicket(e.target.value)}
                placeholder="Contoh: TKT-123456-ABCD"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-black font-semibold text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticket.trim()}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LACAK"}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-2xl border border-red-100 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Aduan Result Detail */}
        {aduan && (
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
                Dilaporkan: {format(new Date(aduan.created_at), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
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
                    Ditindaklanjuti pada: {format(new Date(aduan.updated_at), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
