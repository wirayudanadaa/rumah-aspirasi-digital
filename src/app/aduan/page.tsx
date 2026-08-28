"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Paperclip } from "lucide-react";
import Link from "next/link";

export default function AduanFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!name || !email || !title || !description) {
      setError("Semua field harus diisi");
      setLoading(false);
      return;
    }

    if (file) {
      formData.set("attachment", file);
    }

    try {
      const response = await fetch("/api/aduan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim laporan. Silakan coba lagi.");
      }

      if (result.warning) {
        console.warn("Laporan terkirim dengan peringatan:", result.warning);
      }

      router.push(`/aduan/success/${result.ticketNumber}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim aduan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Buat Laporan Aduan</h1>
          <p className="text-slate-500 mb-8">Silakan isi formulir di bawah ini dengan data yang valid.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
                  placeholder="Budi Santoso"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Alamat Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
                  placeholder="budi@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-700">Judul Laporan</label>
              <input
                type="text"
                id="title"
                name="title"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
                placeholder="Contoh: Jalan berlubang di jalan Sudirman"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">Isi Laporan Lengkap</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-black"
                placeholder="Jelaskan detail permasalahan, lokasi, dan kronologi kejadian..."
                required
              ></textarea>
            </div>

            <div className="pt-2 pb-2">
              <div className="flex items-center gap-3">
                <label 
                  htmlFor="attachment" 
                  className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-slate-300"
                >
                  <Paperclip className="w-4 h-4" />
                  Upload Lampiran
                </label>
                <input 
                  type="file" 
                  id="attachment" 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                />
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {file ? file.name : "Maks. 2MB (JPG, PNG, PDF)"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Laporan"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
