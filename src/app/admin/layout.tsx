"use client";

import Link from "next/link";
import { LayoutDashboard, Home, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0D47A1] text-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 font-black text-white text-lg border-b border-[#1565C0] gap-2">
          <Home className="w-5 h-5 text-[#90CAF9]" />
          <span>Rumah Aspirasi Admin</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1565C0] text-white font-bold text-sm shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-[#90CAF9]" />
            Daftar Aduan
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1565C0]/50 hover:text-white transition-colors cursor-not-allowed opacity-50 text-sm font-medium">
            <Settings className="w-5 h-5" />
            Pengaturan
          </div>
        </nav>
        <div className="p-4 border-t border-[#1565C0]">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1565C0] text-white transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Ke Beranda
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden text-slate-900">
        <header className="h-16 bg-white border-b border-[#90CAF9]/40 flex items-center px-8 shadow-sm z-10">
          <h1 className="font-bold text-[#0D47A1]">Portal Pengelola - Rumah Aspirasi Digital</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
