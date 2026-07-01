"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, QrCode, Eye, BookOpen, Trophy } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function ParentPortalPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleView = () => {
    const token = code.trim();
    if (!token) return;
    router.push(`/parent/student/${encodeURIComponent(token)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size={26} showName light={false} />
          <span className="text-slate-300 text-lg">·</span>
          <span className="text-sm font-semibold text-violet-700">Ota-ona portali</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-lg">Ota-ona / O'qituvchi Portali</h1>
              <p className="text-violet-200 text-sm">O'quvchi taraqqiyotini kuzating</p>
            </div>
          </div>
          <p className="text-sm text-violet-100 leading-relaxed">
            Farzandingiz yoki o'quvchingiz AbituriyentAI platformasidagi o'quv faoliyatini,
            imtihon natijalarini va rivojlanish dinamikasini kuzating.
          </p>
        </div>

        {/* Code entry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-bold text-slate-800 mb-1">Ulashish kodi kiriting</h2>
          <p className="text-sm text-slate-500 mb-4">
            O'quvchi o'z profilidan ulashish kodini beradi. Kodni quyida kiriting.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleView()}
              placeholder="Ulashish kodini kiriting..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
            />
            <button
              onClick={handleView}
              disabled={!code.trim()}
              className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> Ko'rish
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Trophy, label: "Imtihon natijalari", desc: "Barcha test natijalari va dinamikasi", color: "text-amber-600 bg-amber-50" },
            { icon: BookOpen, label: "O'quv faoliyati", desc: "Tugatilgan darslar va mavzular", color: "text-blue-600 bg-blue-50" },
            { icon: QrCode,  label: "Real vaqt",        desc: "Har doim yangilanib turadigan ma'lumotlar", color: "text-violet-600 bg-violet-50" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* How to get code */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-bold text-amber-800 text-sm mb-2">📱 Ulashish kodi qanday olinadi?</p>
          <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>O'quvchi AbituriyentAI platformasiga kiradi</li>
            <li>Profil → Sozlamalar sahifasini ochadi</li>
            <li>"Ota-ona ulashish kodi" bo'limini topadi</li>
            <li>Kodni nusxa olib sizga beradi</li>
          </ol>
        </div>

      </main>
    </div>
  );
}
