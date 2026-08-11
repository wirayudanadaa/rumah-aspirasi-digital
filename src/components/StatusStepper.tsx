"use client";

import { FileEdit, ShieldAlert, Clock, CheckCircle, XCircle } from "lucide-react";
import { AduanStatus } from "@/lib/supabase";

interface StepperProps {
  status: AduanStatus;
}

export function StatusStepper({ status }: StepperProps) {
  if (status === "DITOLAK") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center justify-center gap-3 text-red-700">
        <XCircle className="w-8 h-8 shrink-0" />
        <div>
          <div className="font-bold text-lg">Laporan Ditolak</div>
          <div className="text-sm text-red-600">Laporan Anda tidak dapat diproses lebih lanjut atau tidak memenuhi kriteria.</div>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "PENDING", label: "Tulis Laporan", desc: "Laporan terkirim", icon: FileEdit },
    { key: "VERIFIKASI", label: "Proses Verifikasi", desc: "Maks. 3 Hari", icon: ShieldAlert },
    { key: "PROSES", label: "Tindak Lanjut", desc: "Maks. 5 Hari", icon: Clock },
    { key: "SELESAI", label: "Selesai", desc: "Ditindaklanjuti", icon: CheckCircle },
  ];

  const getStepState = (stepKey: string) => {
    const order = ["PENDING", "VERIFIKASI", "PROSES", "SELESAI"];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const Icon = step.icon;

          let bgClass = "bg-white text-slate-400 border-slate-200";
          let circleClass = "bg-slate-100 text-slate-400";
          
          if (state === "completed") {
            bgClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
            circleClass = "bg-emerald-600 text-white";
          } else if (state === "current") {
            bgClass = "bg-[#E3F2FD] text-[#0D47A1] border-[#90CAF9] ring-4 ring-[#90CAF9]/30";
            circleClass = "bg-[#1565C0] text-white animate-pulse";
          }

          return (
            <div 
              key={step.key} 
              className={`p-4 rounded-2xl border ${bgClass} transition-all flex flex-col items-center text-center space-y-2 relative shadow-sm`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${circleClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Langkah {idx + 1}</div>
                <div className="font-bold text-sm leading-tight text-slate-900">{step.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
