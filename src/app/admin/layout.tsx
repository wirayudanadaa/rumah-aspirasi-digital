"use client";

import Link from "next/link";
import { LayoutDashboard, Home, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#0D47A1] text-slate-200 flex flex-col 
          transition-transform duration-300 ease-in-out 
          lg:translate-x-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 font-black text-white text-lg border-b border-[#1565C0]">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#90CAF9]" />
            <span>Rumah Aspirasi Admin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-[#1565C0] rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-4">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1565C0] text-white font-bold text-sm shadow-sm"
            onClick={() => setIsSidebarOpen(false)}
          >
            <LayoutDashboard className="w-5 h-5 text-[#90CAF9]" />
            Daftar Aduan
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1565C0]/50 hover:text-white transition-colors cursor-not-allowed opacity-50 text-sm font-medium">
            <Settings className="w-5 h-5" />
            Pengaturan
          </div>
        </nav>
        <div className="p-4 border-t border-[#1565C0]">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1565C0] text-white transition-colors text-sm font-medium"
            onClick={() => setIsSidebarOpen(false)}
          >
            <LogOut className="w-5 h-5" />
            Ke Beranda
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col min-h-screen text-slate-900 lg:pl-64 transition-all duration-300">
        <header className="sticky top-0 h-16 bg-white border-b border-[#90CAF9]/40 flex items-center px-4 lg:px-8 shadow-sm z-10 gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-[#0D47A1] min-w-0 line-clamp-2 leading-tight text-sm sm:text-base">Portal Pengelola - Rumah Aspirasi Digital</h1>
        </header>
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
