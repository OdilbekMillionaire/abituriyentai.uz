"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Send, Flag } from "lucide-react";
import { useSubmitExam } from "@/lib/queries";
import { QuestionCard } from "./QuestionCard";
import { TimerDisplay } from "./TimerDisplay";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { cn, SUBJECT_INFO } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import type { ExamSession, Subject } from "@/types";

interface ExamSimulatorProps {
  session: ExamSession;
  onComplete: (sessionId: number) => void;
}

type AnswerMap = Record<number, "A" | "B" | "C" | "D" | null>;

export function ExamSimulator({ session, onComplete }: ExamSimulatorProps) {
  const { tr } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const init: AnswerMap = {};
    session.questions.forEach((q) => (init[q.id] = null));
    return init;
  });
  const [secondsRemaining, setSecondsRemaining] = useState(
    session.time_limit_minutes * 60
  );
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false); // sync guard — state updates are async

  const submitExam = useSubmitExam();

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoSubmit = useCallback(async () => {
    await doSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function doSubmit() {
    if (isSubmittingRef.current) return; // sync guard prevents race condition
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    clearInterval(timerRef.current!);

    try {
      const answerPayload = session.questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id] ?? null,
      }));
      const result = await submitExam.mutateAsync({
        session_id: session.session_id,
        answers: answerPayload,
      });
      onComplete(result.session_id);
    } catch (err) {
      console.error("Topshirishda xatolik:", err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  }

  const currentQuestion = session.questions[currentIndex];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const unansweredCount = session.questions.length - answeredCount;
  const flaggedCount = flagged.size;

  function toggleFlag(questionId: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  // Group question indices by subject for the navigation panel
  const subjectGroups: Partial<Record<Subject, number[]>> = {};
  session.questions.forEach((q, idx) => {
    if (!subjectGroups[q.subject]) subjectGroups[q.subject] = [];
    subjectGroups[q.subject]!.push(idx);
  });

  return (
    <div className="exam-focus-mode">
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              {answeredCount}/{session.questions.length}
            </span>
            <div className="w-24 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <TimerDisplay secondsRemaining={secondsRemaining} />

          {/* Submit button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{tr("exam_submit_btn")}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-24">
        <div className="flex gap-6">
          {/* Question navigation panel */}
          <aside className="hidden md:block w-52 lg:w-64 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">{tr("exam_questions_nav")}</h3>

              {(Object.keys(subjectGroups) as Subject[]).map((subject) => {
                const indices = subjectGroups[subject]!;
                const info = SUBJECT_INFO[subject];
                return (
                  <div key={subject} className="mb-4">
                    <div className={`text-xs font-medium px-2 py-1 rounded ${info.bgColor} ${info.textColor} mb-2`}>
                      {info.label.split(" ")[0]}
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {indices.map((idx) => {
                        const q = session.questions[idx];
                        const isAnswered = answers[q.id] !== null;
                        const isCurrent = idx === currentIndex;
                        const isFlagged = flagged.has(q.id);
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                              "relative w-9 h-9 rounded-lg text-xs font-bold transition-all",
                              isCurrent && `${info.bgColor} ${info.textColor} ring-2 ring-offset-1`,
                              !isCurrent && isAnswered && "bg-slate-700 text-white",
                              !isCurrent && !isAnswered && "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            )}
                          >
                            {idx + 1}
                            {isFlagged && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 bg-slate-700 rounded" />
                  <span>{tr("exam_answered")} ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded" />
                  <span>{tr("exam_unanswered")} ({unansweredCount})</span>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="relative w-4 h-4 bg-slate-100 border border-slate-200 rounded">
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />
                    </div>
                    <span>Belgilangan ({flaggedCount})</span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main question area */}
          <div className="flex-1 min-w-0">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={session.questions.length}
              selectedOption={answers[currentQuestion.id]}
              onSelectOption={(option) => {
                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
              }}
            />

            {/* Flag button */}
            <div className="flex justify-end mt-2">
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                  flagged.has(currentQuestion.id)
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged.has(currentQuestion.id) ? "Belgilangan" : "Belgilash"}
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                {tr("exam_prev")}
              </button>

              {/* Mobile question number bubbles */}
              <div className="flex items-center gap-1 md:hidden overflow-x-auto max-w-[160px] sm:max-w-xs pb-0.5">
                {session.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-6 h-6 rounded-full text-xs font-bold transition-all",
                      idx === currentIndex ? "bg-blue-600 text-white" :
                      answers[session.questions[idx].id] !== null ? "bg-slate-600 text-white" :
                      "bg-slate-200 text-slate-500"
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentIndex < session.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(session.questions.length - 1, i + 1))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                >
                  {tr("exam_next_btn")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  {tr("exam_submit_btn")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">
                  {tr("exam_confirm_title")}
                </h3>
                <p className="text-slate-500 text-sm">
                  {tr("exam_confirm_text")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Javob berildi:</span>
                <span className="font-bold text-green-600">{answeredCount} / {session.questions.length}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Javob berilmadi:</span>
                  <span className="font-bold text-orange-500">{unansweredCount} / {session.questions.length} ⚠️</span>
                </div>
              )}
              {flaggedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Belgilangan:</span>
                  <span className="font-bold text-amber-600">{flaggedCount} ta 🚩</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                <span className="text-slate-600">{tr("exam_time_left")}:</span>
                <span className="font-mono font-bold text-slate-700">
                  {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-700">
                {unansweredCount} {tr("exam_unanswered_warn")}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                {tr("cancel")}
              </button>
              <button
                onClick={doSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? tr("exam_submitting") : tr("exam_confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
