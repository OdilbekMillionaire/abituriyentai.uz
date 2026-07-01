import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { examsApi, lessonsApi, userApi, appealsApi, authApi, aiApi, drillApi, bookmarksApi, studyPlanApi } from "./api";
import type {
  ExamSession,
  ExamResult,
  ExamReviewResponse,
  StudyPlanResponse,
  BookmarkListResponse,
  DrillQuestion,
  DrillAnswerResult,
  DrillStats,
  ProgressHistoryResponse,
  Lesson,
  LessonListItem,
  LessonCompleteResponse,
  UserProfile,
  LeaderboardEntry,
  AppealResponse,
  ExamSubmitRequest,
  WeakAreasResponse,
} from "@/types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
  userProfile:     ["user", "profile"] as const,
  userStats:       ["user", "stats"] as const,
  userWeakAreas:   ["user", "weak-areas"] as const,
  leaderboard:     (limit: number) => ["user", "leaderboard", limit] as const,
  examSession:     (subject: string) => ["exam", "session", subject] as const,
  examResults:     (sessionId: number) => ["exam", "results", sessionId] as const,
  examReview:      (sessionId: number) => ["exam", "review", sessionId] as const,
  examHistory:     ["exam", "history"] as const,
  lessonList:      (subject?: string) => ["lessons", subject ?? "all"] as const,
  lessonDetail:    (id: number) => ["lessons", id] as const,
  appeal:          (questionId: number) => ["appeals", questionId] as const,
  drillDue:        (subject?: string) => ["drill", "due", subject ?? "all"] as const,
  drillStats:      ["drill", "stats"] as const,
  progressHistory: ["user", "progress-history"] as const,
  bookmarks:       ["bookmarks"] as const,
  bookmarkIds:     ["bookmarks", "ids"] as const,
  studyPlan:       (examDate: string) => ["study-plan", examDate] as const,
};

// ── User / Profile ────────────────────────────────────────────────────────────

export function useUserProfile(): UseQueryResult<UserProfile> {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res.data as UserProfile;
    },
    staleTime: 60_000, // 1 minute
  });
}

export function useLeaderboard(limit = 20): UseQueryResult<LeaderboardEntry[]> {
  return useQuery({
    queryKey: queryKeys.leaderboard(limit),
    queryFn: async () => {
      const res = await userApi.getLeaderboard(limit);
      return res.data as LeaderboardEntry[];
    },
    staleTime: 5 * 60_000, // 5 minutes
  });
}

export function useDailyCheckin(): UseMutationResult<unknown, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await userApi.dailyCheckin();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
  });
}

// ── Exam ──────────────────────────────────────────────────────────────────────

export function useStartExam(): UseMutationResult<ExamSession, Error, { subject: "all" | "mother_tongue" | "mathematics" | "history"; timeLimitMinutes?: number }> {
  return useMutation({
    mutationFn: async ({ subject, timeLimitMinutes = 0 }) => {
      const res = await examsApi.start(subject, "practice", timeLimitMinutes);
      return res.data as ExamSession;
    },
  });
}

export function useExamSession(
  subject: "all" | "mother_tongue" | "mathematics" | "history" = "all",
  enabled = false
): UseQueryResult<ExamSession> {
  return useQuery({
    queryKey: queryKeys.examSession(subject),
    queryFn: async () => {
      const res = await examsApi.start(subject);
      return res.data as ExamSession;
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSubmitExam(): UseMutationResult<ExamResult, Error, ExamSubmitRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExamSubmitRequest) => {
      const res = await examsApi.submit(payload.session_id, payload.answers);
      return res.data as ExamResult;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.examResults(data.session_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      queryClient.invalidateQueries({ queryKey: queryKeys.examHistory });
    },
  });
}

export function useExamResults(sessionId: number): UseQueryResult<ExamResult> {
  return useQuery({
    queryKey: queryKeys.examResults(sessionId),
    queryFn: async () => {
      const res = await examsApi.getResults(sessionId);
      return res.data as ExamResult;
    },
    enabled: sessionId > 0,
    staleTime: Infinity, // Results don't change
  });
}

export function useExamReview(sessionId: number): UseQueryResult<ExamReviewResponse> {
  return useQuery({
    queryKey: queryKeys.examReview(sessionId),
    queryFn: async () => {
      const res = await examsApi.getReview(sessionId);
      return res.data as ExamReviewResponse;
    },
    enabled: sessionId > 0,
    staleTime: Infinity, // Review data never changes
  });
}

export function useExamPercentile(sessionId: number): UseQueryResult<{ percentile: number }> {
  return useQuery({
    queryKey: ["examPercentile", sessionId],
    queryFn: async () => {
      const res = await examsApi.getPercentile(sessionId);
      return res.data as { percentile: number };
    },
    enabled: sessionId > 0,
    staleTime: Infinity,
  });
}

export function useExamHistory(): UseQueryResult<ExamResult[]> {
  return useQuery({
    queryKey: queryKeys.examHistory,
    queryFn: async () => {
      const res = await examsApi.getHistory();
      return res.data as ExamResult[];
    },
    staleTime: 60_000,
  });
}

interface UserStats {
  exams_taken: number;
  lessons_completed: number;
  average_score: number;
  best_score: number;
}

export function useUserStats(): UseQueryResult<UserStats> {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const res = await userApi.getStats();
      return res.data.profile ? res.data : res.data;
    },
    staleTime: 2 * 60_000,
  });
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export function useLessons(subject?: string): UseQueryResult<LessonListItem[]> {
  return useQuery({
    queryKey: queryKeys.lessonList(subject),
    queryFn: async () => {
      const res = await lessonsApi.list(subject);
      return res.data as LessonListItem[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLesson(id: number): UseQueryResult<Lesson> {
  return useQuery({
    queryKey: queryKeys.lessonDetail(id),
    queryFn: async () => {
      const res = await lessonsApi.getById(id);
      return res.data as Lesson;
    },
    enabled: id > 0,
    staleTime: 10 * 60_000,
  });
}

export function useCompleteLesson(): UseMutationResult<
  LessonCompleteResponse,
  Error,
  { lessonId: number; quizScore?: number; language?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, quizScore, language }) => {
      const res = await lessonsApi.complete(lessonId, quizScore, language);
      return res.data as LessonCompleteResponse;
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonDetail(lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
  });
}

// ── Appeals ───────────────────────────────────────────────────────────────────

export function useAppeal(questionId: number): UseMutationResult<AppealResponse, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (qId: number) => {
      const res = await appealsApi.appealQuestion(qId);
      return res.data as AppealResponse;
    },
    onSuccess: (data, qId) => {
      queryClient.setQueryData(queryKeys.appeal(qId), data);
    },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useWeakAreas(): UseQueryResult<WeakAreasResponse> {
  return useQuery({
    queryKey: queryKeys.userWeakAreas,
    queryFn: async () => {
      const res = await userApi.getWeakAreas();
      return res.data as WeakAreasResponse;
    },
    staleTime: 2 * 60_000,
  });
}

// ── Drill / Spaced Repetition ─────────────────────────────────────────────────

export function useDrillDue(subject?: string, limit = 10): UseQueryResult<DrillQuestion[]> {
  return useQuery({
    queryKey: queryKeys.drillDue(subject),
    queryFn: async () => {
      const res = await drillApi.getDue(subject, limit);
      return res.data as DrillQuestion[];
    },
    staleTime: 0,
    gcTime: 0,
  });
}

export function useDrillStats(): UseQueryResult<DrillStats> {
  return useQuery({
    queryKey: queryKeys.drillStats,
    queryFn: async () => {
      const res = await drillApi.getStats();
      return res.data as DrillStats;
    },
    staleTime: 60_000,
  });
}

export function useDrillAnswer(): UseMutationResult<DrillAnswerResult, Error, { cardId: number; selectedOption: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, selectedOption }) => {
      const res = await drillApi.answer(cardId, selectedOption);
      return res.data as DrillAnswerResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drill"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
  });
}

export function useStudyPlan(examDate: string): UseQueryResult<StudyPlanResponse> {
  return useQuery({
    queryKey: queryKeys.studyPlan(examDate),
    queryFn: async () => {
      const res = await studyPlanApi.get(examDate);
      return res.data as StudyPlanResponse;
    },
    enabled: !!examDate,
    staleTime: 5 * 60_000,
  });
}

export function useBookmarks(): UseQueryResult<BookmarkListResponse> {
  return useQuery({
    queryKey: queryKeys.bookmarks,
    queryFn: async () => {
      const res = await bookmarksApi.list();
      return res.data as BookmarkListResponse;
    },
    staleTime: 60_000,
  });
}

export function useBookmarkIds(): UseQueryResult<number[]> {
  return useQuery({
    queryKey: queryKeys.bookmarkIds,
    queryFn: async () => {
      const res = await bookmarksApi.ids();
      return res.data as number[];
    },
    staleTime: 60_000,
  });
}

export function useToggleBookmark(): UseMutationResult<{ question_id: number; bookmarked: boolean }, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: number) => {
      const res = await bookmarksApi.toggle(questionId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkIds });
    },
  });
}

export function useProgressHistory(): UseQueryResult<ProgressHistoryResponse> {
  return useQuery({
    queryKey: queryKeys.progressHistory,
    queryFn: async () => {
      const res = await userApi.getProgressHistory();
      return res.data as ProgressHistoryResponse;
    },
    staleTime: 2 * 60_000,
  });
}

// ── AI Tutor (Gemini) ──────────────────────────────────────────────────────

export function useExamHint(): UseMutationResult<
  { hint: string; question_id: number; model_used: string },
  Error,
  { questionId: number; language?: "uz" | "ru" }
> {
  return useMutation({
    mutationFn: async ({ questionId, language = "uz" }) => {
      const res = await aiApi.getHint(questionId, language);
      return res.data;
    },
  });
}
