"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { 
  AlertCircle, 
  FileText, 
  Building2, 
  Calendar, 
  MapPin, 
  Paperclip, 
  UserX, 
  Lock, 
  Loader2, 
  Send 
} from "lucide-react";
import { AduanClassification } from "@/lib/supabase";

export function AduanForm() {
  const router = useRouter();
  const [classification, setClassification] = useState<AduanClassification>("PENGADUAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Validate required text fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!name || !email || !title || !description) {
      setError("Semua field wajib yang bertanda bintang (*) harus diisi!");
      setLoading(false);
      return;
    }
    
    formData.set("classification", classification);
    formData.set("is_anonymous", isAnonymous ? "true" : "false");
    formData.set("is_secret", isSecret ? "true" : "false");

    if (file) {
      formData.set("attachment", file);
    }

    if (turnstileToken) {
      formData.set("turnstile_token", turnstileToken);
    }

    try {
      const response = await fetch("/api/aduan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim laporan. Silakan coba lagi.");
      }

      if (result.warning) {
        console.warn("Laporan terkirim dengan peringatan:", result.warning);
      }

      router.push(`/aduan/success/${result.ticketNumber}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim aduan.";
      setError(message);

      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-[#90CAF9]/60 overflow-hidden">
      {/* Form Classification Header */}
      <div className="p-4 md:p-8 bg-[#E3F2FD]/50 border-b border-[#90CAF9]/40">
        <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Pilih Klasifikasi Laporan Anda
        </h2>

        <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setClassification("PENGADUAN")}
            className={`py-3 md:py-3.5 px-2 md:px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
              classification === "PENGADUAN"
                ? "bg-[#1565C0] text-white border-[#0D47A1] shadow-md scale-[1.02]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
            }`}
          >
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm text-center">PENGADUAN</span>
          </button>

          <button
            type="button"
            onClick={() => setClassification("ASPIRASI")}
            className={`py-3 md:py-3.5 px-2 md:px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
              classification === "ASPIRASI"
                ? "bg-[#00838F] text-white border-[#006064] shadow-md scale-[1.02]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
            }`}
          >
            <FileText className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm text-center">ASPIRASI</span>
          </button>

          <button
            type="button"
            onClick={() => setClassification("PERMINTAAN_INFORMASI")}
            className={`py-3 md:py-3.5 px-2 md:px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
              classification === "PERMINTAAN_INFORMASI"
                ? "bg-[#283593] text-white border-[#1A237E] shadow-md scale-[1.02]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
            }`}
          >
            <Building2 className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm text-center">INFO</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-5 md:space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Identity Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Nama Lengkap *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ketik Nama Lengkap"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Alamat Email *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="email@contoh.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm"
            />
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Judul Laporan *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ketik Judul Laporan *"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Isi Laporan *
          </label>
          <textarea
            name="description"
            rows={5}
            required
            placeholder="Ketik Isi Laporan secara rinci dan kronologis *"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm resize-none"
          ></textarea>
        </div>

        {/* Extra Metadata Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 bg-[#E3F2FD]/30 p-4 md:p-6 rounded-2xl border border-[#90CAF9]/40">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1565C0]" />
              Tanggal Kejadian
            </label>
            <input
              type="date"
              name="date_of_incident"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1565C0]" />
              Lokasi Kejadian
            </label>
            <input
              type="text"
              name="location"
              placeholder="Misal: DKI Jakarta"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#1565C0]" />
              Instansi Tujuan
            </label>
            <select
              name="institution"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm bg-white"
            >
              <option value="">Pilih Instansi</option>
              <option value="Kementerian Dalam Negeri">Kementerian Dalam Negeri</option>
              <option value="Kementerian Kesehatan">Kementerian Kesehatan</option>
              <option value="Kementerian Pendidikan">Kementerian Pendidikan</option>
              <option value="Dinas Perhubungan">Dinas Perhubungan</option>
              <option value="Dinas Pekerjaan Umum">Dinas Pekerjaan Umum</option>
              <option value="Pemerintah Kota/Kabupaten">Pemerintah Kota/Kabupaten</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1565C0]" />
              Kategori Laporan
            </label>
            <select
              name="category"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm bg-white"
            >
              <option value="">Pilih Kategori</option>
              <option value="Infrastruktur & Fasilitas">Infrastruktur & Fasilitas</option>
              <option value="Pelayanan Publik">Pelayanan Publik</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Ketertiban umum">Ketertiban Umum</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Attachment & Privacy Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label 
              htmlFor="attachment" 
              className="cursor-pointer bg-slate-100 hover:bg-[#E3F2FD] text-slate-700 hover:text-[#1565C0] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-slate-300 w-full sm:w-auto"
            >
              <Paperclip className="w-4 h-4 shrink-0" />
              Upload Lampiran
            </label>
            <input 
              type="file" 
              id="attachment" 
              onChange={handleFileChange}
              className="hidden" 
              accept=".jpg,.jpeg,.png,.pdf" 
            />
            <span className="text-xs text-slate-500 truncate max-w-[200px] text-center sm:text-left">
              {file ? file.name : "Maks. 2MB (JPG, PNG, PDF)"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 justify-center sm:justify-start">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-[#1565C0] focus:ring-[#1565C0] border-slate-300"
              />
              <UserX className="w-4 h-4 text-slate-500" />
              Anonim
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 rounded text-[#1565C0] focus:ring-[#1565C0] border-slate-300"
              />
              <Lock className="w-4 h-4 text-slate-500" />
              Rahasia
            </label>
          </div>
        </div>

        {/* Turnstile Widget */}
        <div className="flex justify-center pt-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white font-extrabold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base uppercase tracking-wider disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                MEMPROSES LAPORAN...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 shrink-0" />
                KIRIM LAPORAN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
