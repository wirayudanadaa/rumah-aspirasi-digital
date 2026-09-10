"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Copy, Home, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SuccessPage() {
  const params = useParams();
  const ticketNumber = params.ticketNumber as string;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-xl mx-auto px-4 pt-16 pb-20">
          <div className="bg-white rounded-3xl shadow-xl border border-[#90CAF9]/60 p-8 md:p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#E3F2FD] text-[#1565C0] rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0D47A1] mb-2">Laporan Berhasil Terkirim!</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Terima kasih. Laporan Anda telah tercatat pada sistem <strong>Rumah Aspirasi Digital</strong> dan akan segera diverifikasi oleh petugas instansi berwenang.
              </p>
            </div>

            {/* Ticket Display */}
            <div className="bg-[#E3F2FD]/60 border border-[#90CAF9] rounded-2xl p-6">
              <p className="text-xs font-bold text-[#0D47A1] uppercase tracking-widest mb-2">Kode Tracking / Nomor Tiket</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl md:text-3xl font-black text-[#1565C0] tracking-wider font-mono break-all">{ticketNumber}</span>
                <button
                  onClick={copyToClipboard}
                  className="p-2.5 bg-white hover:bg-[#E3F2FD] rounded-xl text-[#1565C0] border border-[#90CAF9] transition-colors shadow-sm shrink-0"
                  title="Salin Nomor Tiket"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copied && <p className="text-xs text-emerald-600 font-bold mt-2">Nomor Tiket Tersalin!</p>}
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-left md:text-center">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-[#1565C0] shrink-0" />
              <span>Simpan nomor tiket ini untuk memantau progres penanganan laporan Anda.</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col md:flex-row gap-3">
              <Link
                href={`/cek-tiket?ticket=${ticketNumber}`}
                className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-md"
              >
                <Search className="w-4 h-4" />
                Lacak Laporan Ini
              </Link>

              <Link
                href="/"
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Home className="w-4 h-4" />
                Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
