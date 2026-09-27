"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { AduanForm } from "@/components/AduanForm";
import { TechText } from "@/components/ui/tech-text";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ScrollStack, ScrollStackItem } from "@/components/ui/scroll-stack";

import { 
  AlertCircle, 
  FileText, 
  Building2, 
  Home as HomeIcon,
  Search,
  BarChart3,
  Send
} from "lucide-react";

export default function Home() {
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
        const supabase = createClient();
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
      } catch {
        console.error("Failed to fetch stats via RPC (falling back to 0)");
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
            
            <h1 className="sr-only">Rumah Aspirasi Digital</h1>
            <div className="h-20 sm:h-28 md:h-36 lg:h-44 w-full max-w-4xl mx-auto flex items-center justify-center">
              <TechText
                text="Rumah Aspirasi Digital"
                color="#0D47A1"
                accentColor="#1976D2"
                fontWeight={800}
                fontSize={120}
                strokeWidth={1.5}
                dashLength={4}
                dashGap={2}
                reveal="letter"
                labels={true}
                draggable={true}
                sweep={true}
                speed={1}
                className="w-full h-full"
              />
            </div>
            
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Sampaikan laporan keluhan, aspirasi pembangunan, dan permohonan informasi pelayanan publik secara terbuka, aman, dan mudah.
            </p>

            {/* Call to Actions (CTA) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
              <AnimatedButton
                href="#form-aduan"
                variant="primary"
                className="w-full sm:w-auto"
              >
                Sampaikan Aduan
              </AnimatedButton>
              <AnimatedButton
                href="/cek-tiket"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Cek Status Laporan
              </AnimatedButton>
            </div>
          </div>
        </section>

        {/* 3. FORM ADUAN SECTION */}
        <section id="form-aduan" className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 pb-20">
          <AduanForm />
        </section>

        {/* 4. JENIS LAYANAN SECTION */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#E3F2FD] border border-[#90CAF9] px-3.5 py-1 rounded-full text-[#0D47A1] text-xs font-bold uppercase tracking-wider shadow-xs">
              Klasifikasi Laporan
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#0D47A1]">Jenis Klasifikasi Layanan</h2>
            <p className="text-slate-600 text-sm font-medium">
              Pilih klasifikasi yang tepat agar laporan Anda dapat dengan cepat diteruskan ke instansi berwenang. Gulir untuk melihat tumpukan kartu klasifikasi.
            </p>
          </div>

          <div className="h-[540px] sm:h-[580px] md:h-[620px] w-full bg-slate-100/70 rounded-[32px] md:rounded-[44px] border border-[#90CAF9]/40 p-2 sm:p-4 shadow-inner relative overflow-hidden">
            <ScrollStack
              itemDistance={90}
              itemScale={0.04}
              itemStackDistance={26}
              stackPosition="18%"
              scaleEndPosition="8%"
              baseScale={0.9}
              className="h-full"
            >
              <ScrollStackItem itemClassName="bg-gradient-to-br from-[#1565C0] via-[#0D47A1] to-[#0A2E6B] text-white border border-white/20">
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-white shadow-inner">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Klasifikasi 01</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white">Pengaduan</h3>
                      </div>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                      Kendala & Pelanggaran
                    </span>
                  </div>

                  <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                    Laporan keluhan mengenai pelayanan publik yang tidak sesuai standar, kendala fasilitas umum, atau pelanggaran di lapangan.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/15">
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      ⏱️ Respon: 1 - 3 Hari Kerja
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      🔒 Opsi: Anonim & Rahasia
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      📋 Contoh: Jalan rusak, lampu padam, pungli
                    </span>
                  </div>
                </div>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-gradient-to-br from-[#00838F] via-[#006064] to-[#004D40] text-white border border-white/20">
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-white shadow-inner">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-teal-200">Klasifikasi 02</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white">Aspirasi</h3>
                      </div>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                      Inovasi & Pembangunan
                    </span>
                  </div>

                  <p className="text-teal-100 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                    Usulan, masukan, ide kreatif, atau saran dari masyarakat demi kemajuan pembangunan dan peningkatan kualitas pelayanan publik.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/15">
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      💡 Sifat: Partisipatif & Konstruktif
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      🏛️ Tindak Lanjut: Masukan Musyawarah / Forum
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      📋 Contoh: Ide taman kota, fasilitas disabilitas
                    </span>
                  </div>
                </div>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-gradient-to-br from-[#283593] via-[#1A237E] to-[#121858] text-white border border-white/20">
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-white shadow-inner">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Klasifikasi 03</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white">Permintaan Informasi</h3>
                      </div>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                      Transparansi Publik
                    </span>
                  </div>

                  <p className="text-indigo-100 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                    Permohonan data, penjelasan kebijakan resmi, atau klarifikasi informasi publik kepada instansi pemerintah berwenang.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/15">
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      ⏱️ Respon: 3 - 5 Hari Kerja
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      📜 Dasar: Hak Keterbukaan Informasi Publik
                    </span>
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      📋 Contoh: Regulasi, APBD, syarat perizinan
                    </span>
                  </div>
                </div>
              </ScrollStackItem>
            </ScrollStack>
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
