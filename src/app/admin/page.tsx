"use client";

import { useEffect, useState } from "react";
import { type Aduan } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Search, FileText, UserX, Building2, AlertCircle } from "lucide-react";

const PAGE_SIZE = 20;

type SupabaseClient = ReturnType<typeof createClient>;

interface AdminStats {
  total: number;
  pengaduan: number;
  aspirasi: number;
  permintaan_informasi: number;
  pending: number;
  verifikasi: number;
  proses: number;
  selesai: number;
  ditolak: number;
}

/**
 * Builds the paginated, filtered, and searched Supabase query for aduan.
 * Filters are applied before pagination so count reflects filtered total.
 */
function buildAduanQuery(
  supabase: SupabaseClient,
  search: string,
  classification: string,
  status: string,
  page: number,
  pageSize: number,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("aduan")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const safeTerm = search.replace(/"/g, ""); // prevent quote issues in filter string
    const term = `%${safeTerm}%`;
    query = query.or(
      `ticket_number.ilike."${term}",title.ilike."${term}",name.ilike."${term}",institution.ilike."${term}"`,
    );
  }

  if (classification !== "ALL") {
    query = query.eq("classification", classification);
  }

  if (status !== "ALL") {
    query = query.eq("status", status);
  }

  return query.range(from, to);
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [aduans, setAduans] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [globalStats, setGlobalStats] = useState<AdminStats>({
    total: 0,
    pengaduan: 0,
    aspirasi: 0,
    permintaan_informasi: 0,
    pending: 0,
    verifikasi: 0,
    proses: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [statsError, setStatsError] = useState(false);

  // Derived: is search debouncing?
  const isSearchDebouncing = searchTerm !== debouncedSearchTerm;

  // Fetch global statistics once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return; // Handled by the main table fetch

        const { data, error } = await supabase.rpc("get_admin_aduan_stats").single();
        if (error) throw error;
        
        if (isMounted && data) {
          setGlobalStats(data as AdminStats);
        }
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string; details?: string; hint?: string };
        console.error("[ADMIN STATS DEBUG] fetch error:", { code: e?.code, message: e?.message, details: e?.details, hint: e?.hint });
        if (isMounted) {
          setStatsError(true);
        }
      }
    };
    
    fetchStats();
    
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search term and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const fetchAduans = async () => {
      setLoading(true);
      try {
        // --- Session check ---
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        console.log("[ADMIN DASHBOARD DEBUG] hasUser:", !!user, "userId:", user?.id ?? "none");

        if (authError || !user) {
          console.error("[ADMIN DASHBOARD DEBUG] auth error:", authError?.message);
          if (isMounted) {
            setFetchError("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
            setLoading(false);
          }
          return;
        }

        // --- SELECT aduan ---
        const { data, count, error } = await buildAduanQuery(
          supabase,
          debouncedSearchTerm,
          classificationFilter,
          statusFilter,
          currentPage,
          PAGE_SIZE,
        );

        console.log("[ADMIN DASHBOARD DEBUG] rowCount:", data?.length ?? 0, "totalCount:", count, "errorCode:", error?.code ?? null, "errorMessage:", error?.message ?? null);

        if (error) throw error;
        if (isMounted) {
          setAduans(data || []);
          if (count !== null) setTotalCount(count);
          setLoading(false);
        }
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error("[ADMIN DASHBOARD DEBUG] fetch error:", { code: e?.code, message: e?.message });
        if (isMounted) {
          setFetchError("Gagal memuat data laporan. Silakan coba lagi.");
          setLoading(false);
        }
      }
    };

    fetchAduans();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, classificationFilter, statusFilter]);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#0D47A1]">Dashboard Pengelolaan Aspirasi &amp; Aduan</h2>
        <p className="text-slate-500 text-sm mt-1">Sistem Pengawasan dan Penanganan Rumah Aspirasi Digital</p>
      </div>

      {/* Stats Counter Cards */}
      {statsError ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-2xl text-sm font-bold shadow-sm">
          Gagal memuat statistik dashboard.
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Section 1: Volume / Overview ─────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ringkasan Volume &amp; Klasifikasi</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total — hero card */}
              <div className="bg-white p-4 rounded-2xl border border-[#90CAF9]/60 shadow-sm flex flex-col justify-between md:col-span-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Laporan</div>
                <div className="text-3xl font-black text-[#0D47A1] leading-none">{globalStats.total}</div>
                <div className="text-[10px] text-slate-400 mt-1">seluruh jenis</div>
              </div>

              <div className="bg-[#E3F2FD] p-4 rounded-2xl border border-[#90CAF9] shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-[#1565C0] uppercase tracking-widest mb-2">Pengaduan</div>
                <div className="text-2xl font-black text-[#1565C0] leading-none">{globalStats.pengaduan}</div>
              </div>

              <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-200 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-widest mb-2">Aspirasi</div>
                <div className="text-2xl font-black text-cyan-800 leading-none">{globalStats.aspirasi}</div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest mb-2">Permintaan Info</div>
                <div className="text-2xl font-black text-indigo-800 leading-none">{globalStats.permintaan_informasi}</div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Action Required & Workflow ────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status Penanganan &amp; Alur Kerja</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Action-required: elevated visual weight */}
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Pending</span>
                </div>
                <div className="text-2xl font-black text-amber-900 leading-none">{globalStats.pending}</div>
                <div className="text-[10px] text-amber-600 mt-1">perlu verifikasi</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border-2 border-purple-300 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Verifikasi</span>
                </div>
                <div className="text-2xl font-black text-purple-900 leading-none">{globalStats.verifikasi}</div>
                <div className="text-[10px] text-purple-600 mt-1">perlu penugasan</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Diproses</div>
                <div className="text-2xl font-black text-blue-900 leading-none">{globalStats.proses}</div>
                <div className="text-[10px] text-blue-500 mt-1">sedang ditindaklanjuti</div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Selesai</div>
                <div className="text-2xl font-black text-emerald-900 leading-none">{globalStats.selesai}</div>
                <div className="text-[10px] text-emerald-500 mt-1">laporan ditutup</div>
              </div>

              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-2">Ditolak</div>
                <div className="text-2xl font-black text-red-900 leading-none">{globalStats.ditolak}</div>
                <div className="text-[10px] text-red-500 mt-1">tidak valid</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#90CAF9]/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input with debounce indicator */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tiket, nama, judul, instansi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Cari laporan"
            className="pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1565C0] w-full text-sm font-medium text-black"
          />
          {/* Subtle debounce indicator: only when actively typing/waiting */}
          {isSearchDebouncing && (
            <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#1565C0] animate-spin" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Classification Filter */}
          <label htmlFor="classification-filter" className="sr-only">Filter Klasifikasi</label>
          <select
            id="classification-filter"
            value={classificationFilter}
            onChange={(e) => { setClassificationFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="PENGADUAN">PENGADUAN</option>
            <option value="ASPIRASI">ASPIRASI</option>
            <option value="PERMINTAAN_INFORMASI">PERMINTAAN INFORMASI</option>
          </select>

          {/* Status Filter */}
          <label htmlFor="status-filter" className="sr-only">Filter Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1565C0]" />
            <p className="font-medium text-sm">Memuat data aduan...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-600">
            <FileText className="w-10 h-10 text-red-300 mb-3" />
            <p className="font-bold">{fetchError}</p>
            <p className="text-xs text-slate-500 mt-1">Periksa console browser untuk detail error.</p>
          </div>
        ) : aduans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">
              {debouncedSearchTerm || classificationFilter !== "ALL" || statusFilter !== "ALL"
                ? "Tidak ada aduan yang sesuai dengan filter."
                : "Belum ada laporan masuk."
              }
            </p>
            {(debouncedSearchTerm || classificationFilter !== "ALL" || statusFilter !== "ALL") && (
              <p className="text-xs mt-1">Coba ubah atau hapus kata kunci pencarian dan filter Anda.</p>
            )}
          </div>
        ) : (
          /* Horizontal scroll container — table scrolls inside, page does not overflow */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-[#E3F2FD]/50 border-b border-[#90CAF9]/40 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-5 py-3" scope="col">Tiket &amp; Tanggal</th>
                  <th className="px-5 py-3" scope="col">Klasifikasi</th>
                  <th className="px-5 py-3" scope="col">Pelapor</th>
                  <th className="px-5 py-3" scope="col">Judul &amp; Instansi</th>
                  <th className="px-5 py-3" scope="col">Status</th>
                  <th className="px-5 py-3 text-right" scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {aduans.map((aduan) => (
                  <tr key={aduan.id} className="hover:bg-[#E3F2FD]/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-mono font-bold text-[#0D47A1] text-xs">{aduan.ticket_number}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {format(new Date(aduan.created_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      {getClassificationBadge(aduan.classification)}
                    </td>

                    <td className="px-5 py-3">
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
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">{aduan.email}</div>
                      )}
                    </td>

                    <td className="px-5 py-3 max-w-0">
                      {/* max-w-0 on the td allows the inner truncate to work properly */}
                      <div
                        className="font-medium text-slate-900 truncate w-full max-w-xs"
                        title={aduan.title}
                      >
                        {aduan.title}
                      </div>
                      {aduan.institution && (
                        <div className="text-[11px] text-[#1565C0] font-semibold mt-0.5 flex items-center gap-1 truncate max-w-xs">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{aduan.institution}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {getStatusBadge(aduan.status)}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/aduan/${aduan.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-[#1565C0] rounded-xl hover:bg-[#0D47A1] transition-colors shadow-sm whitespace-nowrap"
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
        
        {/* Pagination Controls */}
        {!loading && !fetchError && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#90CAF9]/40 bg-[#E3F2FD]/20">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-bold text-[#1565C0] bg-white border border-[#90CAF9] rounded-lg hover:bg-[#E3F2FD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page <span className="font-bold text-[#0D47A1]">{totalCount === 0 ? 0 : currentPage}</span> of <span className="font-bold text-[#0D47A1]">{Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE) || loading}
              className="px-4 py-2 text-sm font-bold text-[#1565C0] bg-white border border-[#90CAF9] rounded-lg hover:bg-[#E3F2FD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
