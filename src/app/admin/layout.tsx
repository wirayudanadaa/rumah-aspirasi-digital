"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ExternalLink, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("admin@rumah-aspirasi.id");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setAdminEmail(data.user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  };

  const handleGlobalRefresh = () => {
    setIsSyncing(true);
    // Dispatch a custom event so child pages can refetch cleanly
    window.dispatchEvent(new CustomEvent("rad:admin:refresh"));
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  // If on login page, render clean standalone page without sidebar/topbar
  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 flex">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Minimalist Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col 
          border-r border-slate-800 shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out 
          lg:translate-x-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 group"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight leading-tight">Rumah Aspirasi</div>
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Portal Pengelola
              </div>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Menu Utama
            </div>
            <nav className="space-y-1">
              <Link 
                href="/admin" 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === "/admin" 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" 
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <LayoutDashboard className={`w-4 h-4 ${pathname === "/admin" ? "text-white" : "text-slate-400"}`} />
                <span>Daftar Laporan</span>
              </Link>

              <Link 
                href="/cek-tiket" 
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Lacak Tiket Publik</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Pintasan Web
            </div>
            <nav className="space-y-1">
              <Link 
                href="/" 
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Buka Portal Publik</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </nav>
          </div>
        </div>

        {/* Footer / Admin Account Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-400/30 shrink-0">
                {adminEmail.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate" title={adminEmail}>
                  {adminEmail}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Administrator</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
              title="Keluar dari portal"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 transition-all duration-300">
        {/* Sticky Minimalist Topbar */}
        <header className="sticky top-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 z-30 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="font-semibold text-slate-900 hidden sm:inline">Admin</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-medium text-slate-700 truncate">Dashboard Pengelolaan</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Realtime Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Production Live</span>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={handleGlobalRefresh}
              className={`p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 transition-all ${
                isSyncing ? "text-blue-600 bg-blue-50" : ""
              }`}
              title="Sinkronkan data terbaru"
              aria-label="Sinkronkan data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Exit to Home */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors"
            >
              <span>Portal Warga</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
