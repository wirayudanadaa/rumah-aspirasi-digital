"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
  Home as HomeIcon,
  Search,
  BarChart3
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [classification, setClassification] = useState<AduanClassification>("PENGADUAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [fileName, setFileName] = useState("");

  // Realtime Stats State
  const [stats, setStats] = useState({
    total: 0,
    proses: 0,
    selesai: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_aduan_stats");
        if (error) throw error;
        if (data && isMounted) {
          const statObj = Array.isArray(data) ? data[0] : data;
          if (statObj) {
            setStats({
              total: Number(statObj.total) || 0,
              proses: Number(statObj.processing) || 0,
              selesai: Number(statObj.completed) || 0,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch stats via RPC (falling back to 0):", err);
        if (isMounted) {
          setStats({ total: 0, proses: 0, selesai: 0 });
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

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
        },
      ]);

      if (dbError) throw dbError;

      router.push(`/aduan/success/${ticketNumber}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim aduan. Pastikan database Supabase sudah terhubung.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        {/* 1. NAVBAR */}
        <Navbar />

        {/* 2. HERO SECTION */}
        <section className="bg-gradient-to-b from-[#E3F2FD] via-white to-slate-100 border-b border-[#90CAF9] pt-16 pb-28 px-4 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-4 z-10 relative">
            <div className="inline-flex items-center gap-2 bg-white/80 border border-[#90CAF9] px-4 py-1.5 rounded-full text-[#0D47A1] text-xs font-bold uppercase tracking-wider shadow-sm">
              <HomeIcon className="w-4 h-4 text-[#1565C0]" />
              Portal Pelayanan Pengaduan & Aspirasi Digital
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0D47A1] leading-tight">
              Rumah Aspirasi Digital
            </h1>
            
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Sampaikan laporan keluhan, aspirasi pembangunan, dan permohonan informasi pelayanan publik secara terbuka, aman, dan mudah.
            </p>

            {/* Call to Actions (CTA) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#form-aduan"
                className="w-full sm:w-auto bg-[#1565C0] hover:bg-[#0D47A1] text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Send className="w-4 h-4" />
                Sampaikan Aduan
              </a>
              <Link
                href="/cek-tiket"
                className="w-full sm:w-auto bg-white hover:bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9] px-8 py-3.5 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Search className="w-4 h-4 text-[#1565C0]" />
                Cek Status Laporan
              </Link>
            </div>
          </div>
        </section>

        {/* 3. FORM ADUAN SECTION */}
        <section id="form-aduan" className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 pb-20">
          <div className="bg-white rounded-3xl shadow-xl border border-[#90CAF9]/60 overflow-hidden">
            
            {/* Form Classification Header */}
            <div className="p-6 md:p-8 bg-[#E3F2FD]/50 border-b border-[#90CAF9]/40">
              <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Pilih Klasifikasi Laporan Anda
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

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Identity Inputs */}
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

              {/* Title Input */}
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

              {/* Description Input */}
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

              {/* Extra Metadata Options */}
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

              {/* Attachment & Privacy Options */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
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
        </section>

        {/* 4. JENIS LAYANAN SECTION */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[#0D47A1]">Jenis Klasifikasi Layanan</h2>
            <p className="text-slate-600 text-sm font-medium">
              Pilih klasifikasi yang tepat agar laporan Anda dapat dengan cepat diteruskan ke instansi berwenang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-[#90CAF9]/60 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 bg-[#1565C0] text-white rounded-2xl flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0D47A1]">Pengaduan</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Laporan keluhan mengenai pelayanan publik yang tidak sesuai standar, kendala fasilitas umum, atau pelanggaran di lapangan.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#90CAF9]/60 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 bg-[#00838F] text-white rounded-2xl flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#006064]">Aspirasi</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Usulan, masukan, ide kreatif, atau saran dari masyarakat demi kemajuan pembangunan dan peningkatan kualitas pelayanan publik.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#90CAF9]/60 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 bg-[#283593] text-white rounded-2xl flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1A237E]">Permintaan Informasi</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Permohonan data, penjelasan kebijakan resmi, atau klarifikasi informasi publik kepada instansi pemerintah berwenang.
              </p>
            </div>
          </div>
        </section>

        {/* 5. CARA KERJA SECTION */}
        <section className="bg-[#E3F2FD]/40 border-y border-[#90CAF9]/40 py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#0D47A1]">Cara Kerja Laporan</h2>
              <p className="text-slate-600 text-sm font-medium">
                Alur transparan penanganan laporan dari awal pengiriman hingga penyelesaian resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#90CAF9]/40 shadow-sm relative space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h4 className="font-bold text-slate-900">Tulis Laporan</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Isi formulir pengaduan dengan jelas, pilih klasifikasi, dan sertakan rincian informasi pendukung.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#90CAF9]/40 shadow-sm relative space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h4 className="font-bold text-slate-900">Verifikasi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dalam waktu maks. 3 hari kerja, petugas akan meninjau kelengkapan laporan Anda sebelum diteruskan.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#90CAF9]/40 shadow-sm relative space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h4 className="font-bold text-slate-900">Tindak Lanjut</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instansi terkait menindaklanjuti dan memproses laporan Anda secara langsung dalam 5 hari kerja.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#90CAF9]/40 shadow-sm relative space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  4
                </div>
                <h4 className="font-bold text-slate-900">Selesai</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Laporan diselesaikan, memperoleh tanggapan resmi dari instansi, dan status laporan ditutup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. STATISTIK SECTION */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="bg-[#1565C0] text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3 mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-sky-200">
                <BarChart3 className="w-4 h-4" />
                Statistik Penanganan
              </div>
              <h2 className="text-2xl md:text-3xl font-black">Statistik Laporan Masuk</h2>
              <p className="text-sky-100 text-xs md:text-sm font-medium">
                Komitmen keterbukaan dan transparansi penanganan laporan di Rumah Aspirasi Digital.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center space-y-1">
                <div className="text-3xl md:text-4xl font-black">{stats.total}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-200">Total Laporan</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center space-y-1">
                <div className="text-3xl md:text-4xl font-black text-amber-300">{stats.proses}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-200">Sedang Diproses</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center space-y-1">
                <div className="text-3xl md:text-4xl font-black text-emerald-300">{stats.selesai}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-200">Selesai</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 7. FOOTER */}
      <Footer />
    </div>
  );
}
