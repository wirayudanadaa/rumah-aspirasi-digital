"use client";

import { useEffect, useState, use } from "react";
import { supabase, type Aduan, type AduanStatus } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
  Send 
} from "lucide-react";
import Link from "next/link";

export default function AdminAduanDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [aduan, setAduan] = useState<Aduan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AduanStatus>("PENDING");
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAduan();
  }, [id]);

  const fetchAduan = async () => {
    try {
      const { data, error } = await supabase
        .from("aduan")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAduan(data);
      setStatus(data.status);
      setReplyContent(data.reply_content || "");
    } catch (error: any) {
      console.error("Error fetching aduan:", error);
      setError("Data aduan tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTindakLanjut = async () => {
    if (!aduan) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("aduan")
        .update({
          status,
          reply_content: replyContent,
          replied_at: replyContent ? new Date().toISOString() : null,
        })
        .eq("id", aduan.id);

      if (error) throw error;
      setAduan({ ...aduan, status, reply_content: replyContent, replied_at: new Date().toISOString() });
      alert("Status & Balasan Resmi berhasil diperbarui!");
    } catch (error: any) {
      console.error("Error updating aduan:", error);
      alert("Gagal memperbarui data.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565C0]" />
      </div>
    );
  }

  if (error || !aduan) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center space-y-4">
        <p className="font-bold">{error || "Aduan tidak ditemukan."}</p>
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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail Laporan & Form Balasan */}
        <div className="md:col-span-2 space-y-6">
          {/* Card Laporan */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {getClassificationBadge(aduan.classification)}
                <span className="font-mono font-bold text-[#0D47A1] text-xs bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#90CAF9]/40">
                  #{aduan.ticket_number}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {format(new Date(aduan.created_at), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">{aduan.title}</h1>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-[#E3F2FD]/30 p-6 rounded-2xl border border-[#90CAF9]/40 text-sm">
                {aduan.description}
              </p>
            </div>

            {/* Metadata Fields Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1565C0]" /> Tanggal Kejadian
                </span>
                <span className="font-semibold text-slate-900">
                  {aduan.date_of_incident ? format(new Date(aduan.date_of_incident), "dd MMM yyyy", { locale: idLocale }) : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1565C0]" /> Lokasi Kejadian
                </span>
                <span className="font-semibold text-slate-900">{aduan.location || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1565C0]" /> Instansi Tujuan
                </span>
                <span className="font-semibold text-slate-900">{aduan.institution || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Tag className="w-3.5 h-3.5 text-[#1565C0]" /> Kategori
                </span>
                <span className="font-semibold text-slate-900">{aduan.category || "-"}</span>
              </div>
            </div>
          </div>

          {/* Form Balasan / Tindak Lanjut Resmi */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <MessageSquare className="w-5 h-5 text-[#1565C0]" />
              <h3 className="font-extrabold text-[#0D47A1] text-lg">Balasan & Tanggapan Resmi Instansi</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Tulis Tanggapan Resmi
                </label>
                <textarea
                  rows={5}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Ketik balasan resmi instansi atau perkembangan penanganan laporan..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveTindakLanjut}
                  disabled={saving}
                  className="bg-[#1565C0] hover:bg-[#0D47A1] text-white font-extrabold px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Simpan & Kirim Tanggapan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status & Info Pelapor */}
        <div className="space-y-6">
          {/* Card Status Update */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-100">
              Update Status Laporan
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Pilih Status Baru</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AduanStatus)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
              >
                <option value="PENDING">PENDING (Baru Masuk)</option>
                <option value="VERIFIKASI">VERIFIKASI (Sedang Diverifikasi)</option>
                <option value="PROSES">PROSES (Sedang Ditindaklanjuti)</option>
                <option value="SELESAI">SELESAI (Laporan Ditutup)</option>
                <option value="DITOLAK">DITOLAK (Dibatalkan/Tidak Valid)</option>
              </select>
            </div>
          </div>

          {/* Card Info Pelapor */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#90CAF9]/60 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-100">
              Informasi Pelapor
            </h3>

            {aduan.is_anonymous ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold">
                <UserX className="w-5 h-5 shrink-0" />
                <span>Pelapor memilih opsi **ANONIM**. Identitas disembunyikan.</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E3F2FD] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#1565C0]" />
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium mb-0.5">Nama Pelapor</div>
                    <div className="font-bold text-slate-900 text-sm">{aduan.name}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
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
                <span>Laporan ini bersifat **RAHASIA**.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
