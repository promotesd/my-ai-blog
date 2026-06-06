"use client";

import { cn } from "@/lib/utils";

// ─── Base Shimmer wrapper ──────────────────────────────────────────────────────
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-200 dark:bg-gray-700/60 rounded-lg",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent",
        "before:animate-[shimmer_1.5s_infinite]",
        className
      )}
    />
  );
}

// ─── Game card skeleton ────────────────────────────────────────────────────────
export function GameCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40">
      <Shimmer className="w-full aspect-[46/21] rounded-none" />
      <div className="p-3 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <Shimmer className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ─── Movie card skeleton ───────────────────────────────────────────────────────
export function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40">
      <Shimmer className="w-full aspect-[2/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Shimmer className="h-4 w-4/5" />
        <Shimmer className="h-3 w-1/3" />
        <div className="flex gap-1">
          <Shimmer className="h-5 w-14 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// ─── Movie list row skeleton ───────────────────────────────────────────────────
export function MovieListSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40">
      <Shimmer className="w-14 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ─── Book card skeleton ────────────────────────────────────────────────────────
export function BookCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40">
      <Shimmer className="w-16 h-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Shimmer className="h-4 w-4/5" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Shimmer className="h-5 w-14 rounded-full" />
        </div>
        <Shimmer className="h-3 w-full" />
      </div>
    </div>
  );
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="w-9 h-9 rounded-lg" />
      </div>
      <Shimmer className="h-8 w-16" />
    </div>
  );
}
