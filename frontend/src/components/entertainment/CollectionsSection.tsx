"use client";

import { useState } from "react";
import { Package, Search, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CollectionItem, CollectionCategory, CollectionCondition } from "@/types/entertainment";
import { COLLECTIONS_DATA } from "@/data/entertainmentData";

const CONDITION_LABEL: Record<CollectionCondition, string> = {
  mint: "✨ Mint",
  good: "👍 Good",
  used: "🔧 Used",
};
const CONDITION_COLOR: Record<CollectionCondition, string> = {
  mint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  used: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const CATEGORY_ICONS: Record<CollectionCategory, string> = {
  "Action Figure": "🤖",
  "Board Game": "🎲",
  "Merchandise": "👕",
  "Funko Pop": "🧸",
  "Trading Card": "🃏",
  "Lainnya": "📦",
};

const ALL_CATEGORIES: Array<CollectionCategory | "all"> = [
  "all",
  "Action Figure",
  "Funko Pop",
  "Board Game",
  "Merchandise",
  "Trading Card",
  "Lainnya",
];

export default function CollectionsSection({ globalSearch }: { globalSearch?: string }) {
  const t = useTranslations("entertainment");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<CollectionCategory | "all">("all");
  const [filterCondition, setFilterCondition] = useState<CollectionCondition | "all">("all");

  const activeSearch = globalSearch || search;

  const filtered = COLLECTIONS_DATA.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterCondition !== "all" && item.condition !== filterCondition) return false;
    if (activeSearch.trim()) {
      return (
        item.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(activeSearch.toLowerCase())
      );
    }
    return true;
  });

  const totalByCategory = COLLECTIONS_DATA.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: "🎁", label: t("stat_total_coll"),  value: COLLECTIONS_DATA.length },
          { icon: "✨",  label: t("stat_mint_cond"),  value: COLLECTIONS_DATA.filter((c) => c.condition === "mint").length },
          { icon: "📅", label: t("stat_latest_year"), value: Math.max(...COLLECTIONS_DATA.map((c) => c.year_acquired)) },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_collection")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accentColor/40 transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {ALL_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilterCategory(c)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterCategory === c ? "bg-accentColor text-white border-accentColor" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {c === "all" ? t("all") : `${CATEGORY_ICONS[c]} ${c}`}
              {c !== "all" && totalByCategory[c] ? ` (${totalByCategory[c]})` : ""}
            </button>
          ))}
        </div>
        {/* Condition filter */}
        <div className="flex gap-2">
          {(["all", "mint", "good", "used"] as const).map((c) => (
            <button key={c} onClick={() => setFilterCondition(c)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all", filterCondition === c ? "bg-accentColor/20 text-accentColor border-accentColor/40" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-accentColor/60")}>
              {c === "all" ? t("all_conditions") : CONDITION_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("no_collections")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <CollectionCard key={item.id} item={item} conditionLabel={CONDITION_LABEL} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ item, conditionLabel }: { item: CollectionItem; conditionLabel: Record<CollectionCondition, string> }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 hover:border-accentColor/60 hover:shadow-lg transition-all duration-300">
      {/* Image area */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {item.image_url && !imgErr ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-5xl">{CATEGORY_ICONS[item.category]}</span>
            <span className="text-xs text-gray-400">{item.category}</span>
          </div>
        )}
        <span className={cn("absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm", CONDITION_COLOR[item.condition])}>
          {conditionLabel[item.condition]}
        </span>
      </div>
      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{item.name}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 flex-shrink-0">{item.year_acquired}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accentColor/10 text-accentColor font-medium">
          {CATEGORY_ICONS[item.category]} {item.category}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{item.description}</p>
        {item.estimated_value && (
          <p className="text-xs font-medium text-accentColor">💰 Est. {item.estimated_value}</p>
        )}
      </div>
    </div>
  );
}
