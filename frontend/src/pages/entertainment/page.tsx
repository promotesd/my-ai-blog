"use client";

import { useState, useMemo, Suspense, lazy, useRef, useEffect } from "react";
import { Search, X, Gamepad2, MonitorPlay, Music, BookOpen, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EntertainmentTab } from "@/types/entertainment";

// Lazy-load heavy sections
const DashboardSection = lazy(() => import("@/components/entertainment/DashboardSection"));
const GamesSection = lazy(() => import("@/components/entertainment/GamesSection"));
const WatchReadSection = lazy(() => import("@/components/entertainment/WatchReadSection"));
const MusicSection = lazy(() => import("@/components/entertainment/MusicSection"));
const BooksSection = lazy(() => import("@/components/entertainment/BooksSection"));

interface Tab {
  id: EntertainmentTab;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function EntertainmentPage() {
  const t = useTranslations("entertainment");
  const [activeTab, setActiveTab] = useState<EntertainmentTab>("dashboard");
  const [globalSearch, setGlobalSearch] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabSticky, setTabSticky] = useState(false);

  const TABS: Tab[] = useMemo(() => [
    { id: "dashboard", label: t("tab_dashboard"), icon: <LayoutDashboard size={16} />, color: "text-gray-500" },
    { id: "games",     label: t("tab_games"),     icon: <Gamepad2 size={16} />,        color: "text-blue-500" },
    { id: "watchread", label: t("tab_watchread"), icon: <MonitorPlay size={16} />,     color: "text-rose-500" },
    { id: "music",     label: t("tab_music"),     icon: <Music size={16} />,           color: "text-green-500" },
    { id: "books",     label: t("tab_books"),     icon: <BookOpen size={16} />,        color: "text-amber-500" },
  ], [t]);

  // Sticky tab observer
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setTabSticky(!e.isIntersecting),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleTabClick = (tab: EntertainmentTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentTab = TABS.find((t) => t.id === activeTab);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 font-jost pt-[4.5rem]">
      {/* ─── Hero header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {/* Grid pattern bg */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Gradient orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accentColor/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-blue-500/8 blur-[60px] pointer-events-none" />

        <div className="relative px-[5%] py-12 md:py-16 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🎮</span>
                <div>
                  <p className="text-xs font-semibold text-accentColor uppercase tracking-widest mb-0.5">Entertainment</p>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {t("page_title")}
                  </h1>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                {t("page_desc")}
              </p>
            </div>

            {/* Global search */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={t("search_all")}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 shadow-sm transition"
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────── */}
      <div ref={tabsRef} />
      <div className={cn(
        "sticky top-[4.5rem] z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-shadow",
        tabSticky && "shadow-md"
      )}>
        <div className="px-[5%] max-w-7xl mx-auto overflow-x-auto scrollbar-none">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-accentColor text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <span className={activeTab === tab.id ? "text-white" : tab.color}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content area ─────────────────────────────────────────── */}
      <div className="px-[5%] py-8 max-w-7xl mx-auto">
        {/* Section header */}
        {activeTab !== "dashboard" && (
          <div className="flex items-center gap-3 mb-6">
            <span className={cn("p-2 rounded-xl bg-gray-100 dark:bg-gray-800", currentTab?.color)}>
              {currentTab?.icon}
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentTab?.label}</h2>
          </div>
        )}

        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-accentColor border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">{t("loading")}</p>
            </div>
          </div>
        }>
          {activeTab === "dashboard" && <DashboardSection onTabClick={handleTabClick} />}
          {activeTab === "games" && <GamesSection globalSearch={globalSearch} />}
          {activeTab === "watchread" && <WatchReadSection globalSearch={globalSearch} />}
          {activeTab === "music" && <MusicSection />}
          {activeTab === "books" && <BooksSection globalSearch={globalSearch} />}
        </Suspense>
      </div>
    </main>
  );
}
