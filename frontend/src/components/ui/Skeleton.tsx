import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded bg-slate-200", className)} />
  );
}

export function SkeletonLine({ w = "full", h = "4", className }: { w?: string; h?: string; className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-slate-200",
        `h-${h}`,
        w === "full" ? "w-full" : `w-${w}`,
        className
      )}
    />
  );
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-3", className)}>
      <SkeletonLine h="5" w="3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} h="4" w={i % 2 === 0 ? "full" : "5/6"} />
      ))}
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-2", className)}>
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine h="4" w="2/3" />
        <SkeletonLine h="3" w="1/3" />
      </div>
      <SkeletonLine h="4" w="16" />
    </div>
  );
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-2", className)}>
      <div className="h-6 w-6 animate-pulse rounded bg-slate-200" />
      <SkeletonLine h="6" w="1/2" />
      <SkeletonLine h="3" w="3/4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* stat chips */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <SkeletonStat key={i} />)}
      </div>
      {/* feature grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
      {/* activity list */}
      <div className="space-y-1">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function LearnSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-2">
          <SkeletonLine h="6" w="40" />
          <SkeletonLine h="4" w="32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
      </div>
    </div>
  );
}
