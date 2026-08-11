"use client";

import { useEffect, useState } from "react";
import { supabase, type Aduan } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Search, FileText, UserX, Building2 } from "lucide-react";

export default function AdminDashboard() {
  const [aduans, setAduans] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchAduans();
  }, []);

  const fetchAduans = async () => {
    try {
      const { data, error } = await supabase
        .from("aduan")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAduans(data || []);
    } catch (error) {
      console.error("Error fetching aduans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="bg-amber-100 text-amber-800 border-amber-300 px-2.5 py-1 rounded-full text-xs font-extrabold border">PENDING</span>;
      case "VERIFIKASI": return <span className="bg-purple-100 text-purple-800 border-purple-300 px-2.5 py-1 rounded-full text-xs font-extrabold border">VERIFIKASI</span>;
      case "PROSES": return <span className="bg-blue-100 text-blue-800 border-blue-300 px-2.5 py-1 rounded-full text-xs font-extrabold border">DIPROSES</span>;
      case "SELESAI": return <span className="bg-emerald-100 text-emerald-800 border-emerald-300 px-2.5 py-1 rounded-full text-xs font-extrabold border">SELESAI</span>;
      case "DITOLAK": return <span className="bg-red-100 text-red-800 border-red-300 px-2.5 py-1 rounded-full text-xs font-extrabold border">DITOLAK</span>;
      default: return null;
    }
  };

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case "PENGADUAN": return <span className="bg-[#1565C0] text-white font-black px-2.5 py-0.5 rounded text-[11px]">PENGADUAN</span>;
      case "ASPIRASI": return <span className="bg-[#00838F] text-white font-black px-2.5 py-0.5 rounded text-[11px]">ASPIRASI</span>;
      case "PERMINTAAN_INFORMASI": return <span className="bg-[#283593] text-white font-black px-2.5 py-0.5 rounded text-[11px]">PERMINTAAN INFORMASI</span>;
      default: return null;
    }
  };

  // Stats Counters
  const totalCount = aduans.length;
  const pengaduanCount = aduans.filter(a => a.classification === "PENGADUAN").length;
  const aspirasiCount = aduans.filter(a => a.classification === "ASPIRASI").length;
  const infoCount = aduans.filter(a => a.classification === "PERMINTAAN_INFORMASI").length;

  const filteredAduans = aduans.filter(aduan => {
    const matchSearch = aduan.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        aduan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        aduan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (aduan.institution && aduan.institution.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchClassification = classificationFilter === "ALL" || aduan.classification === classificationFilter;
    const matchStatus = statusFilter === "ALL" || aduan.status === statusFilter;

    return matchSearch && matchClassification && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#0D47A1]">Dashboard Pengelolaan Aspirasi & Aduan</h2>
        <p className="text-slate-500 text-sm mt-1">Sistem Pengawasan dan Penanganan Rumah Aspirasi Digital</p>
      </div>

      {/* Stats Counter Cards with #E3F2FD and #90CAF9 accent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#90CAF9]/60 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Laporan</div>
          <div className="text-3xl font-black text-[#0D47A1]">{totalCount}</div>
        </div>

        <div className="bg-[#E3F2FD] p-5 rounded-2xl border border-[#90CAF9] shadow-sm">
          <div className="text-xs font-bold text-[#1565C0] uppercase tracking-wider mb-1">Pengaduan</div>
          <div className="text-3xl font-black text-[#1565C0]">{pengaduanCount}</div>
        </div>

        <div className="bg-cyan-50 p-5 rounded-2xl border border-cyan-200 shadow-sm">
          <div className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-1">Aspirasi</div>
          <div className="text-3xl font-black text-cyan-800">{aspirasiCount}</div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 shadow-sm">
          <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Permintaan Info</div>
          <div className="text-3xl font-black text-indigo-800">{infoCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#90CAF9]/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tiket, nama, judul, instansi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1565C0] w-full text-sm font-medium text-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="PENGADUAN">PENGADUAN</option>
            <option value="ASPIRASI">ASPIRASI</option>
            <option value="PERMINTAAN_INFORMASI">PERMINTAAN INFORMASI</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIKASI">VERIFIKASI</option>
            <option value="PROSES">DIPROSES</option>
            <option value="SELESAI">SELESAI</option>
            <option value="DITOLAK">DITOLAK</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#90CAF9]/60 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1565C0]" />
            <p className="font-medium text-sm">Memuat data aduan...</p>
          </div>
        ) : filteredAduans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">Tidak ada aduan ditemukan</p>
            <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E3F2FD]/50 border-b border-[#90CAF9]/40 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Tiket & Tanggal</th>
                  <th className="px-6 py-4">Klasifikasi</th>
                  <th className="px-6 py-4">Pelapor</th>
                  <th className="px-6 py-4">Judul & Instansi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAduans.map((aduan) => (
                  <tr key={aduan.id} className="hover:bg-[#E3F2FD]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-[#0D47A1]">{aduan.ticket_number}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {format(new Date(aduan.created_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {getClassificationBadge(aduan.classification)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {aduan.is_anonymous ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Anonim
                          </span>
                        ) : (
                          aduan.name
                        )}
                      </div>
                      {!aduan.is_anonymous && (
                        <div className="text-xs text-slate-400 mt-0.5">{aduan.email}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">{aduan.title}</div>
                      {aduan.institution && (
                        <div className="text-xs text-[#1565C0] font-semibold mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {aduan.institution}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(aduan.status)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/aduan/${aduan.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-[#1565C0] rounded-xl hover:bg-[#0D47A1] transition-colors shadow-sm"
                      >
                        Tindak Lanjut
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
