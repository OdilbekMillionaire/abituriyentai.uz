"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarkIds, useToggleBookmark } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  questionId: number;
  className?: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ questionId, className, size = "md" }: BookmarkButtonProps) {
  const { data: ids } = useBookmarkIds();
  const toggle = useToggleBookmark();
  const isBookmarked = ids?.includes(questionId) ?? false;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate(questionId);
      }}
      disabled={toggle.isPending}
      title={isBookmarked ? "Saqlangan — bosib o'chirish" : "Saqlash"}
      className={cn(
        "flex items-center justify-center rounded-lg transition-colors",
        size === "sm" ? "w-7 h-7" : "w-9 h-9",
        isBookmarked
          ? "text-yellow-500 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
        "disabled:opacity-50",
        className
      )}
    >
      {isBookmarked
        ? <BookmarkCheck className={size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        : <Bookmark className={size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
      }
    </button>
  );
}
