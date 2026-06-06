interface Props {
  view?: "grid" | "list"
}

export default function BlogPageCardSkeleton({ view = "grid" }: Props) {
  if (view === "list") {
    return (
      <div className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 overflow-hidden">
        {/* Thumbnail */}
        <div className="shrink-0 w-28 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer" />

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700 shimmer" />
          </div>
          {/* Title */}
          <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 shimmer mb-1.5" />
          <div className="h-3.5 w-1/2 rounded bg-gray-200 dark:bg-gray-700 shimmer mb-2" />
          {/* Excerpt */}
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 shimmer mb-1" />
          {/* Meta */}
          <div className="flex items-center gap-3 mt-1">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
            <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
          </div>
        </div>
      </div>
    )
  }

  // Grid skeleton
  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative w-full h-44 shrink-0 bg-gray-200 dark:bg-gray-700 shimmer">
        {/* Category badge */}
        <div className="absolute top-3 left-3 h-5 w-20 rounded-full bg-gray-300/70 dark:bg-gray-600/70 shimmer" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 shimmer mb-2" />
        <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700 shimmer mb-3" />

        {/* Excerpt lines */}
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 shimmer" />
          <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
          <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shimmer shrink-0" />
            <div>
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 shimmer mb-1" />
              <div className="h-2.5 w-12 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
            </div>
          </div>
          {/* Reading time */}
          <div className="h-3 w-10 rounded bg-gray-200 dark:bg-gray-700 shimmer" />
        </div>
      </div>
    </div>
  )
}
