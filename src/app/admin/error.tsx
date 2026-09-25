"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon } from "lucide-react";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // LOG-01: Sanitized error logging to prevent raw object exposure
    console.error("Admin Error Boundary triggered");
  }, [error]);

  return (
    <div className="h-full min-h-[60vh] w-full flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <AlertOctagon className="w-8 h-8" aria-hidden="true" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kendala Sistem
          </h1>
          <p className="text-slate-500 font-medium">
            Terjadi masalah saat memuat halaman admin. Silakan coba kembali.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full bg-[#0D47A1] text-white rounded-xl px-4 py-3 font-semibold hover:bg-[#1565C0] focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:ring-offset-2 transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/admin"
            className="w-full bg-slate-100 text-slate-700 rounded-xl px-4 py-3 font-semibold hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors inline-block"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
