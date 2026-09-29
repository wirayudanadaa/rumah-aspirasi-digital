import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Aduan } from './supabase';
import { formatSafeDate } from './date';

export const exportSinglePDF = (aduan: Aduan, history: any[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RUMAH ASPIRASI DIGITAL", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Portal Pengelola", 14, 27);
  doc.text("Kementerian Kelautan dan Perikanan", 14, 34);

  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Ticket Info
  doc.setFont("helvetica", "bold");
  doc.text("NOMOR TIKET", 14, 48);
  doc.setFontSize(14);
  doc.text(aduan.ticket_number, 14, 55);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 255);
  doc.text(aduan.status, 150, 55);
  doc.setTextColor(0, 0, 0);
  
  doc.line(14, 60, 196, 60);

  let currentY = 68;

  // Informasi Laporan
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI LAPORAN", 14, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;
  doc.text(`Klasifikasi : ${aduan.classification}`, 14, currentY); currentY += 6;
  
  // Use splitTextToSize for long text
  const judulLines = doc.splitTextToSize(`Judul       : ${aduan.title}`, 180);
  doc.text(judulLines, 14, currentY); currentY += (judulLines.length * 6);
  
  doc.text(`Kategori    : ${aduan.category || '-'}`, 14, currentY); currentY += 6;
  doc.text(`Instansi    : ${aduan.institution || '-'}`, 14, currentY); currentY += 6;
  doc.text(`Tanggal     : ${aduan.date_of_incident ? formatSafeDate(aduan.date_of_incident, "dd MMM yyyy") : '-'}`, 14, currentY); currentY += 6;
  doc.text(`Lokasi      : ${aduan.location || '-'}`, 14, currentY); currentY += 8;

  doc.line(14, currentY, 196, currentY); currentY += 8;

  // Informasi Pelapor
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI PELAPOR", 14, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;

  if (aduan.is_anonymous) {
    doc.text("Pelapor memilih opsi ANONIM", 14, currentY); currentY += 8;
  } else {
    doc.text(`Nama        : ${aduan.name || '-'}`, 14, currentY); currentY += 6;
    doc.text(`Email       : ${aduan.email || '-'}`, 14, currentY); currentY += 8;
  }

  if (aduan.is_secret) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(255, 0, 0);
    doc.text("DOKUMEN INTERNAL / RAHASIA", 14, currentY); currentY += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  doc.line(14, currentY, 196, currentY); currentY += 8;

  // Isi Laporan
  doc.setFont("helvetica", "bold");
  doc.text("ISI LAPORAN", 14, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;
  const descLines = doc.splitTextToSize(aduan.description, 180);
  doc.text(descLines, 14, currentY); currentY += (descLines.length * 6) + 4;

  doc.line(14, currentY, 196, currentY); currentY += 8;

  // Tindak Lanjut
  doc.setFont("helvetica", "bold");
  doc.text("TINDAK LANJUT", 14, currentY);
  doc.setFont("helvetica", "normal");
  currentY += 8;
  if (aduan.reply_content) {
    const replyLines = doc.splitTextToSize(aduan.reply_content, 180);
    doc.text(replyLines, 14, currentY); currentY += (replyLines.length * 6) + 4;
  } else {
    doc.text("Belum ada tanggapan resmi.", 14, currentY); currentY += 10;
  }
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  } else {
    doc.line(14, currentY, 196, currentY); currentY += 8;
  }

  // Riwayat Penanganan
  doc.setFont("helvetica", "bold");
  doc.text("RIWAYAT PENANGANAN", 14, currentY);
  currentY += 4;
  
  const historyData = history.map(h => [
    formatSafeDate(h.created_at, "dd MMM yyyy, HH:mm"),
    h.action,
    h.actor_email || '-',
    h.notes || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Tanggal', 'Aksi', 'Actor', 'Keterangan']],
    body: historyData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [21, 101, 192] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.text("Rumah Aspirasi Digital • Dokumen Resmi", 14, finalY);

  doc.save(`RAP-${aduan.ticket_number}.pdf`);
};

export const exportSingleXLSX = (aduan: Aduan, history: any[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detail Aduan
  const detailData = [
    ["Nomor Tiket", aduan.ticket_number],
    ["Klasifikasi", aduan.classification],
    ["Status", aduan.status],
    ["Judul", aduan.title],
    ["Kategori", aduan.category || "-"],
    ["Instansi Tujuan", aduan.institution || "-"],
    ["Tanggal Kejadian", aduan.date_of_incident ? formatSafeDate(aduan.date_of_incident, "dd MMM yyyy") : "-"],
    ["Lokasi Kejadian", aduan.location || "-"],
    ["Nama Pelapor", aduan.is_anonymous ? "ANONIM" : (aduan.name || "-")],
    ["Email", aduan.is_anonymous ? "ANONIM" : (aduan.email || "-")],
    ["Deskripsi", aduan.description],
    ["Tanggapan", aduan.reply_content || "-"],
    ["Privasi", aduan.is_secret ? "RAHASIA" : "UMUM"]
  ];
  
  const wsDetail = XLSX.utils.aoa_to_sheet([["Field", "Nilai"], ...detailData]);
  wsDetail['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Aduan");

  // Sheet 2: Riwayat
  const historyData = history.map(h => ({
    Tanggal: formatSafeDate(h.created_at, "dd MMM yyyy, HH:mm"),
    Aksi: h.action,
    Actor: h.actor_email || "-",
    Keterangan: h.notes || "-"
  }));
  const wsHistory = XLSX.utils.json_to_sheet(historyData);
  XLSX.utils.book_append_sheet(wb, wsHistory, "Riwayat");

  XLSX.writeFile(wb, `RAP-${aduan.ticket_number}.xlsx`);
};

export const exportBulkPDF = (aduans: Aduan[], filters: any) => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RUMAH ASPIRASI DIGITAL", 14, 20);
  doc.text("REKAP LAPORAN", 14, 28);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal Export: ${formatSafeDate(new Date().toISOString(), "dd MMMM yyyy")}`, 14, 40);
  doc.text(`Filter Status: ${filters.status}`, 14, 46);
  doc.text(`Filter Klasifikasi: ${filters.classification}`, 14, 52);
  doc.text(`Total Laporan: ${aduans.length}`, 14, 58);

  const tableData = aduans.map((a, index) => [
    index + 1,
    a.ticket_number,
    formatSafeDate(a.created_at, "dd MMM yyyy"),
    a.classification,
    a.title,
    a.is_anonymous ? "ANONIM" : a.name,
    a.institution || "-",
    a.status
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['No', 'No. Tiket', 'Tanggal', 'Klasifikasi', 'Judul', 'Pelapor', 'Instansi', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192] },
    columnStyles: {
      4: { cellWidth: 50 }
    }
  });

  const today = new Date().toISOString().split('T')[0];
  doc.save(`RAP-Rekap-Aduan-${today}.pdf`);
};

export const exportBulkXLSX = (aduans: Aduan[], filters: any) => {
  const wb = XLSX.utils.book_new();

  // 1. Rekap Laporan
  const tableData = aduans.map((a, index) => ({
    No: index + 1,
    "Nomor Tiket": a.ticket_number,
    "Tanggal Dibuat": formatSafeDate(a.created_at, "dd MMM yyyy"),
    Klasifikasi: a.classification,
    Judul: a.title,
    "Nama Pelapor": a.is_anonymous ? "ANONIM" : a.name,
    Email: a.is_anonymous ? "ANONIM" : a.email,
    Kategori: a.category || "-",
    Instansi: a.institution || "-",
    "Tanggal Kejadian": a.date_of_incident ? formatSafeDate(a.date_of_incident, "dd MMM yyyy") : "-",
    Lokasi: a.location || "-",
    Status: a.status,
    "Tanggal Update": a.replied_at ? formatSafeDate(a.replied_at, "dd MMM yyyy, HH:mm") : "-",
    Tanggapan: a.reply_content || "-"
  }));

  const wsRekap = XLSX.utils.json_to_sheet(tableData);
  XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Laporan");

  // 2. Ringkasan
  const stats = {
    Total: aduans.length,
    PENDING: aduans.filter(a => a.status === 'PENDING').length,
    DIPROSES: aduans.filter(a => a.status === 'PROSES').length,
    SELESAI: aduans.filter(a => a.status === 'SELESAI').length,
    PENGADUAN: aduans.filter(a => a.classification === 'PENGADUAN').length,
    ASPIRASI: aduans.filter(a => a.classification === 'ASPIRASI').length,
    INFORMASI: aduans.filter(a => a.classification === 'PERMINTAAN_INFORMASI').length,
  };

  const wsRingkasan = XLSX.utils.aoa_to_sheet([
    ["Ringkasan", "Jumlah"],
    ["Total Laporan", stats.Total],
    ["PENDING", stats.PENDING],
    ["DIPROSES", stats.DIPROSES],
    ["SELESAI", stats.SELESAI],
    ["PENGADUAN", stats.PENGADUAN],
    ["ASPIRASI", stats.ASPIRASI],
    ["PERMINTAAN_INFORMASI", stats.INFORMASI],
  ]);
  XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `RAP-Rekap-Aduan-${today}.xlsx`);
};
