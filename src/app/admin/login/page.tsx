"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, Mail, ShieldCheck, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {

  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin";
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError("Email atau password salah. Silakan periksa kembali dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1565C0] shadow-lg mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0D47A1] tracking-tight">
            Portal Admin
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Rumah Aspirasi Digital
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#90CAF9]/60 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            Masuk ke Portal Pengelola
          </h2>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 text-red-700 bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email Admin
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-slate-900 text-sm font-medium placeholder:text-slate-400 transition-all"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-slate-900 text-sm font-medium placeholder:text-slate-400 transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold py-3.5 rounded-2xl transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2 text-sm uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Portal"
              )}
            </button>

          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Halaman ini hanya diperuntukkan bagi petugas berwenang.
        </p>

      </div>
    </div>
  );
}
