"use client";

import { useEffect, useState, useCallback } from "react";
import { type Aduan } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatSafeDate } from "@/lib/date";
import { CrystalLoader } from "@/components/ui/CrystalLoader";
import { 
  // Loader2,
  Search, 
  FileText, 
  UserX, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  RotateCcw, 
  Layers,
  Inbox,
  X,
  Table
} from "lucide-react";
import { exportBulkPDF, exportBulkXLSX } from "@/lib/exportUtils";

const PAGE_SIZE = 15;

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
    .select("id, ticket_number, created_at, classification, is_anonymous, name, email, title, institution, status", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const escapedSearch = search
      .replace(/"/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    const term = `%${escapedSearch}%`;
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
  const [statsLoading, setStatsLoading] = useState(true);
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

  const [unauthorized, setUnauthorized] = useState(false);
  const [exportingBulkPDF, setExportingBulkPDF] = useState(false);
  const [exportingBulkXLSX, setExportingBulkXLSX] = useState(false);

  const isSearchDebouncing = searchTerm !== debouncedSearchTerm;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  };

  // Synchronized stats calculation directly from Supabase
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) return;

      const { data, error } = await supabase
        .from("aduan")
        .select("status, classification");

      if (error) {
        if (error.code === "42501") {
          setUnauthorized(true);
          return;
        }
        throw error;
      }

      const rows = data || [];
      const stats: AdminStats = {
        total: rows.length,
        pengaduan: 0,
        aspirasi: 0,
        permintaan_informasi: 0,
        pending: 0,
        verifikasi: 0,
        proses: 0,
        selesai: 0,
        ditolak: 0,
      };

      rows.forEach((r) => {
        const c = (r.classification || "").toUpperCase();
        if (c === "PENGADUAN") stats.pengaduan++;
        else if (c === "ASPIRASI") stats.aspirasi++;
        else if (c === "PERMINTAAN_INFORMASI" || c === "INFORMASI") stats.permintaan_informasi++;

        const s = (r.status || "").toUpperCase();
        if (s === "PENDING") stats.pending++;
        else if (s === "VERIFIKASI") stats.verifikasi++;
        else if (s === "PROSES" || s === "DIPROSES") stats.proses++;
        else if (s === "SELESAI") stats.selesai++;
        else if (s === "DITOLAK") stats.ditolak++;
      });

      setGlobalStats(stats);
    } catch {
      console.error("[ADMIN STATS] Gagal menyinkronkan statistik");
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  // Fetch paginated table records
  const fetchAduans = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setFetchError("Sesi autentikasi telah berakhir. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const { data, count, error } = await buildAduanQuery(
        supabase,
        debouncedSearchTerm,
        classificationFilter,
        statusFilter,
        currentPage,
        PAGE_SIZE,
      );

      if (error) {
        if (error.code === "42501") {
          setUnauthorized(true);
        } else {
          setFetchError("Gagal memuat data laporan dari database.");
        }
        setLoading(false);
        return;
      }

      setAduans((data as unknown as Aduan[]) || []);
      if (count !== null) setTotalCount(count);
    } catch {
      setFetchError("Terjadi gangguan koneksi saat memuat data laporan.");
    } finally {
      setLoading(false);
    }
  }, [supabase, debouncedSearchTerm, classificationFilter, statusFilter, currentPage]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load & query dependencies
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAduans();
  }, [fetchAduans]);

  // Listen to global header refresh event
  useEffect(() => {
    const onRefresh = () => {
      fetchStats();
      fetchAduans();
    };
    window.addEventListener("rad:admin:refresh", onRefresh);
    return () => window.removeEventListener("rad:admin:refresh", onRefresh);
  }, [fetchStats, fetchAduans]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setClassificationFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const isFiltered = searchTerm !== "" || classificationFilter !== "ALL" || statusFilter !== "ALL";

  const fetchAllForExport = async () => {
    let query = supabase
      .from("aduan")
      .select("id, ticket_number, created_at, classification, is_anonymous, is_secret, name, email, title, description, institution, status, category, date_of_incident, location, response, replied_at")
      .order("created_at", { ascending: false });

    if (debouncedSearchTerm) {
      const escapedSearch = debouncedSearchTerm
        .replace(/"/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");

      const term = `%${escapedSearch}%`;
      query = query.or(
        `ticket_number.ilike."${term}",title.ilike."${term}",name.ilike."${term}",institution.ilike."${term}"`,
      );
    }

    if (classificationFilter !== "ALL") {
      query = query.eq("classification", classificationFilter);
    }

    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(d => ({ ...d, reply_content: d.response })) as Aduan[];
  };

  const handleExportBulkPDF = async () => {
    setExportingBulkPDF(true);
    try {
      const data = await fetchAllForExport();
      exportBulkPDF(data, {
        status: statusFilter === "ALL" ? "Semua" : statusFilter,
        classification: classificationFilter === "ALL" ? "Semua" : classificationFilter,
      });
    } catch (e) {
      console.error(e);
      alert("Gagal melakukan export PDF. Silakan coba lagi.");
    } finally {
      setExportingBulkPDF(false);
    }
  };

  const handleExportBulkXLSX = async () => {
    setExportingBulkXLSX(true);
    try {
      const data = await fetchAllForExport();
      exportBulkXLSX(data);
    } catch (e) {
      console.error(e);
      alert("Gagal melakukan export XLSX. Silakan coba lagi.");
    } finally {
      setExportingBulkXLSX(false);
    }
  };

  // Badges & Labels
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PENDING
          </span>
        );
      case "VERIFIKASI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            VERIFIKASI
          </span>
        );
      case "PROSES":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            DIPROSES
          </span>
        );
      case "SELESAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SELESAI
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            DITOLAK
          </span>
        );
      default:
        return null;
    }
  };

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case "PENGADUAN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Pengaduan
          </span>
        );
      case "ASPIRASI":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
            Aspirasi
          </span>
        );
      case "PERMINTAAN_INFORMASI":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Permintaan Info
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            Lainnya
          </span>
        );
    }
  };

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserX className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Terbatas</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Akun Anda tidak memiliki hak akses administrator pada sistem Rumah Aspirasi Digital.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-xs text-sm"
          >
            Keluar dari Sesi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Laporan</h1>
        </div>
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Minimalist Synchronized KPI Metrics Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card: Total */}
        <button
          type="button"
          onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "ALL" 
              ? "border-blue-500 ring-2 ring-blue-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-slate-400" /> : globalStats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">seluruh laporan</div>
        </button>

        {/* Card: Pending */}
        <button
          type="button"
          onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "PENDING" 
              ? "border-amber-500 ring-2 ring-amber-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-amber-400" /> : globalStats.pending}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">perlu verifikasi</div>
        </button>

        {/* Card: Verifikasi */}
        <button
          type="button"
          onClick={() => { setStatusFilter("VERIFIKASI"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "VERIFIKASI" 
              ? "border-purple-500 ring-2 ring-purple-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verifikasi</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-purple-400" /> : globalStats.verifikasi}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-1">siap penugasan</div>
        </button>

        {/* Card: Diproses */}
        <button
          type="button"
          onClick={() => { setStatusFilter("PROSES"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "PROSES" 
              ? "border-blue-500 ring-2 ring-blue-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Diproses</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-blue-400" /> : globalStats.proses}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1">ditindaklanjuti</div>
        </button>

        {/* Card: Selesai */}
        <button
          type="button"
          onClick={() => { setStatusFilter("SELESAI"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "SELESAI" 
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-emerald-400" /> : globalStats.selesai}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">laporan ditutup</div>
        </button>

        {/* Card: Ditolak */}
        <button
          type="button"
          onClick={() => { setStatusFilter("DITOLAK"); setCurrentPage(1); }}
          className={`p-4 rounded-2xl bg-white text-left transition-all border ${
            statusFilter === "DITOLAK" 
              ? "border-rose-500 ring-2 ring-rose-500/10 shadow-xs" 
              : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ditolak</span>
            <X className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-900 tracking-tight">
            {statsLoading ? <CrystalLoader size={20} className="text-rose-400" /> : globalStats.ditolak}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">tidak memenuhi syarat</div>
        </button>
      </div>

      {/* ── Classification Segmented Filter Pills ────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 rounded-xl overflow-x-auto text-xs w-full sm:w-auto">
        <button
          type="button"
          onClick={() => { setClassificationFilter("ALL"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            classificationFilter === "ALL"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Semua Jenis ({globalStats.total})
        </button>
        <button
          type="button"
          onClick={() => { setClassificationFilter("PENGADUAN"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            classificationFilter === "PENGADUAN"
              ? "bg-white text-blue-700 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pengaduan ({globalStats.pengaduan})
        </button>
        <button
          type="button"
          onClick={() => { setClassificationFilter("ASPIRASI"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            classificationFilter === "ASPIRASI"
              ? "bg-white text-teal-700 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Aspirasi ({globalStats.aspirasi})
        </button>
        <button
          type="button"
          onClick={() => { setClassificationFilter("PERMINTAAN_INFORMASI"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            classificationFilter === "PERMINTAAN_INFORMASI"
              ? "bg-white text-indigo-700 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Permintaan Informasi ({globalStats.permintaan_informasi})
        </button>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tiket, judul, pelapor, atau instansi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Cari laporan"
            className="pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
          />
          {searchTerm && !isSearchDebouncing && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Hapus kata kunci pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isSearchDebouncing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 flex items-center justify-center">
              <CrystalLoader size={14} />
            </div>
          )}
        </div>

        {/* Dropdowns & Active Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Classification Dropdown */}
          <select
            value={classificationFilter}
            onChange={(e) => { setClassificationFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            aria-label="Filter klasifikasi"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="PENGADUAN">Pengaduan</option>
            <option value="ASPIRASI">Aspirasi</option>
            <option value="PERMINTAAN_INFORMASI">Permintaan Info</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            aria-label="Filter status"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIKASI">Verifikasi</option>
            <option value="PROSES">Diproses</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>

          {/* Result Count Indicator */}
          <div className="text-xs font-medium text-slate-500 px-2">
            {totalCount} laporan
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExportBulkPDF}
              disabled={exportingBulkPDF || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              {exportingBulkPDF ? <CrystalLoader size={12} className="text-red-600" /> : <FileText className="w-3.5 h-3.5" />}
              {exportingBulkPDF ? "Exporting..." : "Rekap PDF"}
            </button>
            <button
              onClick={handleExportBulkXLSX}
              disabled={exportingBulkXLSX || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              {exportingBulkXLSX ? <CrystalLoader size={12} className="text-green-700" /> : <Table className="w-3.5 h-3.5" />}
              {exportingBulkXLSX ? "Exporting..." : "Rekap XLSX"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Data Table Container ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="mb-3 text-blue-600 flex items-center justify-center">
              <CrystalLoader size={28} />
            </div>
            <p className="font-medium text-sm text-slate-600">Menyinkronkan data laporan...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800">{fetchError}</p>
            <button
              onClick={fetchAduans}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : aduans.length === 0 ? (
          /* Clean & Minimalist Empty States */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {isFiltered ? (
              <div className="space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Tidak Ada Laporan yang Cocok</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tidak ditemukan laporan yang sesuai dengan filter atau kata kunci pencarian Anda.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Kriteria Filter</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100/80 flex items-center justify-center text-blue-600 mx-auto">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Belum Ada Laporan Masuk</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Database sistem dalam kondisi bersih. Setiap laporan baru yang diajukan oleh masyarakat akan otomatis muncul di sini secara real-time.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
                  >
                    <span>Buka Portal Warga</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={fetchAduans}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <span>Periksa Ulang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* High-Legibility Minimalist Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5" scope="col">Tiket &amp; Waktu</th>
                  <th className="px-5 py-3.5" scope="col">Klasifikasi</th>
                  <th className="px-5 py-3.5" scope="col">Pelapor</th>
                  <th className="px-5 py-3.5" scope="col">Judul &amp; Instansi</th>
                  <th className="px-5 py-3.5" scope="col">Status</th>
                  <th className="px-5 py-3.5 text-right" scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {aduans.map((aduan) => (
                  <tr key={aduan.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md inline-block border border-slate-200/60">
                        {aduan.ticket_number}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {formatSafeDate(aduan.created_at, "dd MMM yyyy, HH:mm")}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {getClassificationBadge(aduan.classification)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        {aduan.is_anonymous ? (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-xs inline-flex items-center gap-1 font-medium">
                            <UserX className="w-3 h-3 text-slate-400" /> Anonim
                          </span>
                        ) : (
                          aduan.name
                        )}
                      </div>
                      {!aduan.is_anonymous && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">{aduan.email}</div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 max-w-0">
                      <div
                        className="font-medium text-slate-900 truncate w-full max-w-sm group-hover:text-blue-600 transition-colors"
                        title={aduan.title}
                      >
                        {aduan.title}
                      </div>
                      {aduan.institution && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 truncate max-w-sm">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{aduan.institution}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {getStatusBadge(aduan.status)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/aduan/${aduan.id}`}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:text-blue-600 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all shadow-2xs whitespace-nowrap"
                      >
                        <span>Kelola</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Minimalist Pagination */}
        {!loading && !fetchError && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-200/60 bg-slate-50/50 gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * PAGE_SIZE, totalCount)}
              </span>{" "}
              dari <span className="font-semibold text-slate-800">{totalCount}</span> laporan
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              >
                Sebelumnya
              </button>

              <span className="text-xs font-medium text-slate-600 px-2">
                Hal {currentPage} dari {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE) || loading}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
