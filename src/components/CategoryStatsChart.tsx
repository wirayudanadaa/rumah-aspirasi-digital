'use client';

import React, { useState } from 'react';
import { AlertCircle, FileText, Building2, TrendingUp, PieChart } from 'lucide-react';

interface CategoryStats {
  pengaduan: number;
  aspirasi: number;
  informasi: number;
}

interface CategoryStatsChartProps {
  categories: CategoryStats;
  total: number;
}

export const CategoryStatsChart: React.FC<CategoryStatsChartProps> = ({
  categories,
  total
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const safeTotal = total > 0 ? total : categories.pengaduan + categories.aspirasi + categories.informasi || 1;

  const pctPengaduan = Math.round((categories.pengaduan / safeTotal) * 1000) / 10;
  const pctAspirasi = Math.round((categories.aspirasi / safeTotal) * 1000) / 10;
  const pctInformasi = Math.max(0.1, Math.round((100 - pctPengaduan - pctAspirasi) * 10) / 10);

  // SVG Donut calculations (Radius = 45, Circumference = 2 * PI * 45 ≈ 282.74)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const arc1 = (pctPengaduan / 100) * circumference;
  const arc2 = (pctAspirasi / 100) * circumference;
  const arc3 = (pctInformasi / 100) * circumference;

  const offset1 = 0;
  const offset2 = -arc1;
  const offset3 = -(arc1 + arc2);

  const categoryList = [
    {
      id: 'pengaduan',
      title: 'Pengaduan',
      count: categories.pengaduan,
      pct: pctPengaduan,
      icon: AlertCircle,
      color: '#38BDF8', // Sky 400
      gradient: 'from-sky-400 to-blue-600',
      badgeColor: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
      tag: 'Kendala Layanan & Fasilitas Umum',
      desc: 'Laporan gangguan fasilitas publik dan keluhan pelayanan'
    },
    {
      id: 'aspirasi',
      title: 'Aspirasi',
      count: categories.aspirasi,
      pct: pctAspirasi,
      icon: FileText,
      color: '#2DD4BF', // Teal 400
      gradient: 'from-teal-400 to-emerald-600',
      badgeColor: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
      tag: 'Pembangunan & Inovasi Publik',
      desc: 'Ide kreatif, masukan, dan saran pembangunan daerah'
    },
    {
      id: 'informasi',
      title: 'Permintaan Informasi',
      count: categories.informasi,
      pct: pctInformasi,
      icon: Building2,
      color: '#FBBF24', // Amber 400
      gradient: 'from-amber-400 to-yellow-600',
      badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
      tag: 'Transparansi & Kebijakan Resmi',
      desc: 'Permohonan klarifikasi data dan regulasi instansi'
    }
  ];

  return (
    <div className="mt-10 pt-10 border-t border-white/15">
      {/* Chart Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 uppercase tracking-wider mb-1">
            <PieChart className="w-3.5 h-3.5 text-sky-300" />
            Distribusi Klasifikasi
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white">
            Grafik Laporan Berdasarkan 3 Kategori
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-sky-100 self-start sm:self-auto border border-white/15">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
          Data Riil Terverifikasi
        </div>
      </div>

      {/* Proportional Multi-Segment Progress Bar */}
      <div className="space-y-2 mb-8">
        <div className="h-4 sm:h-5 w-full bg-white/10 rounded-full p-1 flex overflow-hidden border border-white/20 shadow-inner">
          <div
            style={{ width: `${pctPengaduan}%` }}
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-l-full transition-all duration-700 relative group cursor-pointer hover:brightness-110"
            title={`Pengaduan: ${categories.pengaduan} (${pctPengaduan}%)`}
            onMouseEnter={() => setActiveCategory('pengaduan')}
            onMouseLeave={() => setActiveCategory(null)}
          />
          <div
            style={{ width: `${pctAspirasi}%` }}
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700 relative group cursor-pointer hover:brightness-110"
            title={`Aspirasi: ${categories.aspirasi} (${pctAspirasi}%)`}
            onMouseEnter={() => setActiveCategory('aspirasi')}
            onMouseLeave={() => setActiveCategory(null)}
          />
          <div
            style={{ width: `${pctInformasi}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-r-full transition-all duration-700 relative group cursor-pointer hover:brightness-110"
            title={`Permintaan Informasi: ${categories.informasi} (${pctInformasi}%)`}
            onMouseEnter={() => setActiveCategory('informasi')}
            onMouseLeave={() => setActiveCategory(null)}
          />
        </div>

        {/* Legend under segment bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-sky-200 px-1 pt-1 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm" />
            <span className="font-semibold text-white">Pengaduan</span> ({pctPengaduan}%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block shadow-sm" />
            <span className="font-semibold text-white">Aspirasi</span> ({pctAspirasi}%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />
            <span className="font-semibold text-white">Informasi</span> ({pctInformasi}%)
          </div>
        </div>
      </div>

      {/* Main Graph Grid: Donut Chart on Left, Detailed Metric Bars on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/15">
        {/* Left: SVG Donut Chart */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 transform">
              {/* Background circle track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-white/10"
                strokeWidth="14"
                fill="transparent"
              />

              {/* Segment 1: Pengaduan */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#38BDF8"
                strokeWidth={activeCategory === 'pengaduan' ? '17' : '14'}
                strokeDasharray={`${arc1} ${circumference}`}
                strokeDashoffset={offset1}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 cursor-pointer hover:stroke-sky-300"
                onMouseEnter={() => setActiveCategory('pengaduan')}
                onMouseLeave={() => setActiveCategory(null)}
              />

              {/* Segment 2: Aspirasi */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#2DD4BF"
                strokeWidth={activeCategory === 'aspirasi' ? '17' : '14'}
                strokeDasharray={`${arc2} ${circumference}`}
                strokeDashoffset={offset2}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 cursor-pointer hover:stroke-teal-300"
                onMouseEnter={() => setActiveCategory('aspirasi')}
                onMouseLeave={() => setActiveCategory(null)}
              />

              {/* Segment 3: Permintaan Informasi */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#FBBF24"
                strokeWidth={activeCategory === 'informasi' ? '17' : '14'}
                strokeDasharray={`${arc3} ${circumference}`}
                strokeDashoffset={offset3}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 cursor-pointer hover:stroke-amber-300"
                onMouseEnter={() => setActiveCategory('informasi')}
                onMouseLeave={() => setActiveCategory(null)}
              />
            </svg>

            {/* Inner Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-3xl font-black text-white leading-none">
                {safeTotal}
              </span>
              <span className="text-[11px] font-bold text-sky-200 uppercase tracking-widest mt-1">
                Laporan
              </span>
            </div>
          </div>
          <span className="text-xs text-sky-200 mt-3 text-center">
            Porsi Per Kategori Layanan Publik
          </span>
        </div>

        {/* Right: Detailed Category Bars with Percentages & Details */}
        <div className="lg:col-span-8 space-y-4">
          {categoryList.map((cat) => {
            const Icon = cat.icon;
            const isHovered = activeCategory === cat.id;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveCategory(cat.id)}
                onMouseLeave={() => setActiveCategory(null)}
                className={`p-4 rounded-xl transition-all duration-300 border ${
                  isHovered
                    ? 'bg-white/15 border-white/30 scale-[1.01] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${cat.color}25` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                        {cat.title}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cat.badgeColor}`}
                        >
                          {cat.tag}
                        </span>
                      </h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base md:text-lg font-black text-white mr-1.5">
                      {cat.count}
                    </span>
                    <span className="text-xs text-sky-200 font-semibold">
                      ({cat.pct}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${cat.gradient} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(4, cat.pct)}%` }}
                  />
                </div>

                {/* Description helper */}
                <p className="text-[11px] text-sky-100/80 mt-1.5 font-medium">
                  {cat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryStatsChart;
