import { AduanForm } from "@/components/AduanForm";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AduanFormPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Form Section */}
        <section className="max-w-4xl mx-auto px-4 py-12 md:py-20 relative z-20">
          <AduanForm />
        </section>
      </div>
      <Footer />
    </div>
  );
}
