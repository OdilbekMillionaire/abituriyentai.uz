"use client";

import { useState } from "react";
import { Scale, X, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useAppeal } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { AppealResponse } from "@/types";

interface AppealButtonProps {
  questionId: number;
  triggerLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function AppealButton({
  questionId,
  triggerLabel = "Murojaat",
  size = "md",
  className,
}: AppealButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appealData, setAppealData] = useState<AppealResponse | null>(null);
  const appeal = useAppeal(questionId);

  async function handleOpen() {
    setIsOpen(true);
    if (!appealData) {
      try {
        const data = await appeal.mutateAsync(questionId);
        setAppealData(data);
      } catch (err) {
        console.error("Appeal xatoligi:", err);
      }
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium transition-colors",
          size === "sm"
            ? "text-xs px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            : "text-sm px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200",
          className
        )}
      >
        <Scale className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        {triggerLabel}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Abituriyent Huquqlari</h2>
                  <p className="text-xs text-slate-400">Rasmiy tushuntirish va manba hujjati</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {appeal.isPending && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                  <p className="text-slate-500 text-sm">Tushuntirish yuklanmoqda...</p>
                </div>
              )}

              {appeal.isError && (
                <div className="text-center py-8">
                  <p className="text-red-500 text-sm">
                    Murojaat yuborishda xatolik. Qayta urinib ko'ring.
                  </p>
                </div>
              )}

              {appealData && (
                <div className="space-y-5">
                  {/* Question preview */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Savol #{appealData.question_id}</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{appealData.question_text}</p>
                  </div>

                  {/* Correct answer */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-bold text-green-800">
                        To'g'ri javob: {appealData.correct_option}
                      </p>
                    </div>
                    <p className="text-green-700 text-sm">{appealData.correct_answer_text}</p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span>📖</span> Tushuntirish
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                      {appealData.explanation}
                    </p>
                  </div>

                  {/* Source decree */}
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-yellow-800 uppercase mb-1">
                          Manba hujjati (BMBA/O'zMB Qaror)
                        </p>
                        <p className="text-yellow-800 text-sm leading-relaxed">
                          {appealData.source_decree}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {appealData.is_competency_based && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
                        Kompetensiyaga asoslangan savol
                      </span>
                    </div>
                  )}

                  {/* Legal note */}
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                    Murojaat vaqti: {new Date(appealData.appeal_timestamp).toLocaleString("uz-UZ")}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
