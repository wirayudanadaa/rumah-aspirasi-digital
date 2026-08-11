"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { supabase, AduanClassification } from "@/lib/supabase";
import { generateTicketNumber } from "@/lib/utils";
import { 
  AlertCircle, 
  Paperclip, 
  Lock, 
  UserX, 
  Loader2, 
  Send, 
  FileText, 
  Building2, 
  MapPin, 
  Calendar,
  Home as HomeIcon
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [classification, setClassification] = useState<AduanClassification>("PENGADUAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      date_of_incident: formData.get("date_of_incident") as string || undefined,
      location: formData.get("location") as string || undefined,
      institution: formData.get("institution") as string || undefined,
      category: formData.get("category") as string || undefined,
    };

    if (!data.name || !data.email || !data.title || !data.description) {
      setError("Semua field wajib yang bertanda bintang (*) harus diisi!");
      setLoading(false);
      return;
    }

    const ticketNumber = generateTicketNumber();

    try {
      const { error: dbError } = await supabase.from("aduan").insert([
        {
          ticket_number: ticketNumber,
          classification,
          name: data.name,
          email: data.email,
          title: data.title,
          description: data.description,
          date_of_incident: data.date_of_incident,
          location: data.location,
          institution: data.institution,
          category: data.category,
          is_anonymous: isAnonymous,
          is_secret: isSecret,
          status: "PENDING",
        },
      ]);

      if (dbError) throw dbError;

      router.push(`/aduan/success/${ticketNumber}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat mengirim aduan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Hero Banner Section with #E3F2FD background and #90CAF9 borders */}
      <section className="bg-gradient-to-b from-[#E3F2FD] via-white to-slate-100 border-b border-[#90CAF9] pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-3 z-10 relative">
          <div className="inline-flex items-center gap-2 bg-[#90CAF9]/30 border border-[#90CAF9] px-4 py-1.5 rounded-full text-[#0D47A1] text-xs font-bold uppercase tracking-wider mb-2">
            <HomeIcon className="w-4 h-4" />
            Portal Pengaduan & Aspirasi Masyarakatan
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#0D47A1]">
            Rumah Aspirasi Digital
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Wadah bagi Anda untuk menyuarakan aspirasi, laporan keluhan, dan permohonan informasi secara terbuka, aman, dan mudah.
          </p>
        </div>
      </section>

      {/* Main Complaint Form Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-[#90CAF9]/60 overflow-hidden">
          
          {/* Header Klasifikasi Laporan */}
          <div className="p-6 md:p-8 bg-[#E3F2FD]/50 border-b border-[#90CAF9]/40">
            <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Pilih Klasifikasi Laporan
            </h2>

            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setClassification("PENGADUAN")}
                className={`py-3.5 px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
                  classification === "PENGADUAN"
                    ? "bg-[#1565C0] text-white border-[#0D47A1] shadow-md scale-[1.02]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                PENGADUAN
              </button>

              <button
                type="button"
                onClick={() => setClassification("ASPIRASI")}
                className={`py-3.5 px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
                  classification === "ASPIRASI"
                    ? "bg-[#00838F] text-white border-[#006064] shadow-md scale-[1.02]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
                }`}
              >
                <FileText className="w-5 h-5" />
                ASPIRASI
              </button>

              <button
                type="button"
                onClick={() => setClassification("PERMINTAAN_INFORMASI")}
                className={`py-3.5 px-3 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase transition-all flex flex-col items-center gap-1.5 border ${
                  classification === "PERMINTAAN_INFORMASI"
                    ? "bg-[#283593] text-white border-[#1A237E] shadow-md scale-[1.02]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-[#E3F2FD]/40"
                }`}
              >
                <Building2 className="w-5 h-5" />
                PERMINTAAN INFORMASI
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Identitas Pelapor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ketik Nama Lengkap Anda"
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

            {/* Judul Laporan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Judul Laporan *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ketik Judul Laporan Anda *"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm"
              />
            </div>

            {/* Isi Laporan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Isi Laporan *
              </label>
              <textarea
                name="description"
                rows={5}
                required
                placeholder="Ketik Isi Laporan Anda secara rinci dan kronologis *"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-medium text-black text-sm resize-none"
              ></textarea>
            </div>

            {/* Field Tambahan: Tanggal, Lokasi, Instansi, Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#E3F2FD]/30 p-6 rounded-2xl border border-[#90CAF9]/40">
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
                  placeholder="Misal: DKI Jakarta, Kota Bandung"
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
                  <option value="">Pilih Instansi Tujuan</option>
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

            {/* Opsi Upload Lampiran & Privasi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
              {/* File upload */}
              <div className="flex items-center gap-3">
                <label 
                  htmlFor="attachment" 
                  className="cursor-pointer bg-slate-100 hover:bg-[#E3F2FD] text-slate-700 hover:text-[#1565C0] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-slate-300"
                >
                  <Paperclip className="w-4 h-4" />
                  Upload Lampiran
                </label>
                <input 
                  type="file" 
                  id="attachment" 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                />
                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                  {fileName || "Maks. 2MB (JPG, PNG, PDF)"}
                </span>
              </div>

              {/* Checkboxes Privasi */}
              <div className="flex items-center gap-6">
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

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white font-extrabold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base uppercase tracking-wider disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    MEMPROSES LAPORAN...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    KIRIM LAPORAN
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Workflow Alur Laporan 5 Langkah */}
        <div className="mt-16 bg-white p-8 rounded-3xl shadow-sm border border-[#90CAF9]/40 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-extrabold text-[#0D47A1]">Alur Penanganan Rumah Aspirasi</h3>
            <p className="text-slate-500 text-sm mt-1">Proses penanganan laporan Anda melalui 5 tahap utama secara transparan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/40 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-black mb-2">1</div>
              <div className="font-bold text-xs uppercase text-slate-900 mb-1">Tulis Laporan</div>
              <div className="text-[11px] text-slate-500">Sampaikan laporan dengan rinci dan jelas</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/40 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-black mb-2">2</div>
              <div className="font-bold text-xs uppercase text-slate-900 mb-1">Verifikasi</div>
              <div className="text-[11px] text-slate-500">Dalam 3 hari laporan diverifikasi petugas</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/40 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-black mb-2">3</div>
              <div className="font-bold text-xs uppercase text-slate-900 mb-1">Tindak Lanjut</div>
              <div className="text-[11px] text-slate-500">Instansi menindaklanjuti dalam 5 hari</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/40 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-black mb-2">4</div>
              <div className="font-bold text-xs uppercase text-slate-900 mb-1">Beri Tanggapan</div>
              <div className="text-[11px] text-slate-500">Pelapor dapat merespons hasil tindak lanjut</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/40 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black mb-2">5</div>
              <div className="font-bold text-xs uppercase text-slate-900 mb-1">Selesai</div>
              <div className="text-[11px] text-slate-500">Laporan selesai dan ditutup</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
