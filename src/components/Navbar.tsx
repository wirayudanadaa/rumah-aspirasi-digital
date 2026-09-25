import Link from "next/link";
import { Home, Search, UserCheck, Send } from "lucide-react";

export function Navbar() {
  return (
    <header className="bg-[#E3F2FD] text-slate-800 border-b border-[#90CAF9] shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#1565C0] text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg md:text-xl tracking-tight text-[#0D47A1] leading-none flex items-center gap-1.5">
              Rumah Aspirasi <span className="bg-[#1565C0] text-white px-2 py-0.5 rounded-md text-xs font-black">Digital</span>
            </div>
            <div className="text-[10px] text-slate-600 tracking-wider font-semibold uppercase mt-0.5">
              Portal Pengaduan & Aspirasi Masyarakat
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-[#1565C0] transition-colors hidden sm:inline-flex">
            Beranda
          </Link>
          <Link href="/#form-aduan" className="hover:text-[#1565C0] transition-colors flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#1565C0]" />
            Sampaikan Aduan
          </Link>
          <Link href="/cek-tiket" className="hover:text-[#1565C0] transition-colors flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#1565C0]" />
            Cek Status
          </Link>
          <Link 
            href="/admin" 
            className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Portal Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
