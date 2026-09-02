"use client";

import Link from "next/link";
import { Home, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#E3F2FD] text-slate-800 border-t border-[#90CAF9] pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1: Platform Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1565C0] text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xl tracking-tight text-[#0D47A1]">
              Rumah Aspirasi <span className="bg-[#1565C0] text-white px-2 py-0.5 rounded-md text-xs font-black">Digital</span>
            </div>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Wadah resmi pelayanan aspirasi, pengaduan masyarakat, dan permohonan informasi publik secara transparan, akuntabel, dan terintegrasi.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1565C0] bg-white/70 px-3 py-1.5 rounded-full w-fit border border-[#90CAF9]/60">
            <ShieldCheck className="w-4 h-4" />
            <span>Kerahasiaan & Keamanan Pelapor Terjamin</span>
          </div>
        </div>

        {/* Col 2: Navigasi Cepat */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#0D47A1]">Navigasi Cepat</h4>
          <ul className="space-y-2 text-sm font-medium text-slate-600">
            <li>
              <Link href="/" className="hover:text-[#1565C0] transition-colors">Beranda</Link>
            </li>
            <li>
              <Link href="/#form-aduan" className="hover:text-[#1565C0] transition-colors">Sampaikan Aduan</Link>
            </li>
            <li>
              <Link href="/cek-tiket" className="hover:text-[#1565C0] transition-colors">Cek Status Laporan</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[#1565C0] transition-colors">Portal Admin</Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Layanan Aspirasi */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#0D47A1]">Klasifikasi Layanan</h4>
          <ul className="space-y-2 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1565C0]"></span>
              Pengaduan Pelayanan
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00838F]"></span>
              Aspirasi Masyarakat
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#283593]"></span>
              Permintaan Informasi
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-[#90CAF9]/60 text-center text-xs font-semibold text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} Rumah Aspirasi Digital. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
