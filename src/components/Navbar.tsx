"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Search, Send, UserCheck, X } from "lucide-react";

const mobileLinks = [
  { href: "/", label: "Beranda", icon: Home, isActive: (path: string) => path === "/" },
  {
    href: "/#form-aduan",
    label: "Sampaikan Aduan",
    icon: Send,
    isActive: (path: string) => path === "/aduan",
  },
  {
    href: "/cek-tiket",
    label: "Cek Status",
    icon: Search,
    isActive: (path: string) => path.startsWith("/cek-tiket"),
  },
  {
    href: "/admin",
    label: "Portal Admin",
    icon: UserCheck,
    isActive: (path: string) => path.startsWith("/admin"),
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    if (!menuOpen) {
      if (wasMenuOpenRef.current) menuButtonRef.current?.focus();
      wasMenuOpenRef.current = false;
      return;
    }

    wasMenuOpenRef.current = true;
    firstMenuLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const menuLinks = document.querySelectorAll<HTMLAnchorElement>("#mobile-navigation a");
      const lastMenuLink = menuLinks.item(menuLinks.length - 1);
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstMenuLinkRef.current) {
        event.preventDefault();
        menuButtonRef.current?.focus();
      } else if (event.shiftKey && activeElement === menuButtonRef.current) {
        event.preventDefault();
        lastMenuLink?.focus();
      } else if (!event.shiftKey && activeElement === lastMenuLink) {
        event.preventDefault();
        menuButtonRef.current?.focus();
      } else if (!event.shiftKey && activeElement === menuButtonRef.current) {
        event.preventDefault();
        firstMenuLinkRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#90CAF9] bg-[#E3F2FD] pt-[env(safe-area-inset-top)] text-slate-800 shadow-sm sm:pt-0">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Rumah Aspirasi Digital, Beranda" className="group flex min-h-11 min-w-11 items-center gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1565C0] text-white shadow-md transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
            <Home className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[15px] font-extrabold leading-tight tracking-tight text-[#0D47A1] sm:text-lg md:text-xl">
              Rumah Aspirasi
              <span className="rounded-md bg-[#1565C0] px-1.5 py-0.5 text-[10px] font-black text-white sm:px-2 sm:text-xs">
                Digital
              </span>
            </span>
            <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:block">
              Portal Pengaduan &amp; Aspirasi Masyarakat
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-4 text-xs font-semibold text-slate-700 sm:flex md:gap-6 md:text-sm">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="hidden transition-colors hover:text-[#1565C0] sm:inline-flex">
            Beranda
          </Link>
          <Link href="/#form-aduan" className="flex items-center gap-1.5 transition-colors hover:text-[#1565C0]">
            <Send className="h-3.5 w-3.5 text-[#1565C0]" aria-hidden="true" />
            Sampaikan Aduan
          </Link>
          <Link href="/cek-tiket" aria-current={pathname.startsWith("/cek-tiket") ? "page" : undefined} className="flex items-center gap-1.5 transition-colors hover:text-[#1565C0]">
            <Search className="h-3.5 w-3.5 text-[#1565C0]" aria-hidden="true" />
            Cek Status
          </Link>
          <Link href="/admin" className="flex items-center gap-1.5 rounded-xl bg-[#1565C0] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0D47A1]">
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Portal Admin
          </Link>
        </nav>

        <button ref={menuButtonRef} type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#0D47A1] transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565C0] sm:hidden" aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-slate-950/25 sm:hidden" aria-label="Tutup menu navigasi" tabIndex={-1} onClick={closeMenu} />
          <nav id="mobile-navigation" aria-label="Navigasi mobile" className="absolute inset-x-0 top-full z-50 border-t border-[#90CAF9] bg-white px-4 pb-4 pt-2 shadow-lg sm:hidden">
            <ul className="mx-auto max-w-6xl space-y-1">
              {mobileLinks.map(({ href, label, icon: Icon, isActive }, index) => {
                const active = isActive(pathname);
                return (
                  <li key={href}>
                    <Link ref={index === 0 ? firstMenuLinkRef : undefined} href={href} aria-current={active ? "page" : undefined} onClick={closeMenu} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1565C0] ${active ? "bg-[#E3F2FD] text-[#0D47A1]" : "text-slate-700 hover:bg-slate-50 hover:text-[#1565C0]"}`}>
                      <Icon className="h-5 w-5 text-[#1565C0]" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
