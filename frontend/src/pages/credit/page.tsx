"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ExternalLink, Palette, Wand2, ArrowLeft, Code2, Star } from "lucide-react"
import { FaGithub as Github } from "react-icons/fa"

export default function CreditPage() {
  const t = useTranslations("creditPage")

  const otherPages = [
    "About", "Skills", "Projects", "Blog", "Guestbook",
    "Gallery", "Timeline", "Tech Stack", "Certificate",
    "Entertainment", "Deploy Projects", "Contact",
  ]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0d1417] pt-[4.5rem]">
      {/* ── Hero ── */}
      <section className="relative px-6 py-20 text-center overflow-hidden bg-gray-100 dark:bg-gray-950">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accentColor/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl" />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-accentColor transition-colors">
            {t("breadcrumb_home")}
          </Link>
          <span>•</span>
          <span className="text-accentColor font-medium">{t("breadcrumb_credit")}</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accentColor/10 border border-accentColor/30 text-accentColor text-sm font-medium mb-6">
          <Star size={14} />
          {t("badge")}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
          {t("title_prefix")}{" "}
          <span className="text-accentColor">{t("title_accent")}</span>
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </section>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 pt-12 space-y-8">

        {/* ── Home Page Credit ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-accentColor" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accentColor">
                  {t("home_section_label")}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {t("home_section_title")}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accentColor/10 text-accentColor text-xs font-semibold border border-accentColor/30">
                <Palette size={12} />
                {t("home_section_badge")}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
              {t("home_desc_1")}{" "}
              <Link
                href="https://github.com/devshinthant"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accentColor font-semibold hover:underline inline-flex items-center gap-1"
              >
                {t("home_author")}
                <ExternalLink size={12} />
              </Link>
              {t("home_desc_2")}
            </p>

            {/* Author card */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accentColor/15 flex items-center justify-center shrink-0">
                  <Code2 size={22} className="text-accentColor" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">devshinthant</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shinn Thant · GitHub</p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <Link
                  href="https://github.com/devshinthant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold hover:opacity-80 transition-opacity"
                >
                  <Github size={13} />
                  {t("view_github")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Other Pages ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-purple-500" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-500">
                  {t("other_section_label")}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {t("other_section_title")}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-semibold border border-purple-500/30">
                <Wand2 size={12} />
                {t("other_section_badge")}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
              {t("other_desc")}
            </p>

            {/* Page badges */}
            <div className="flex flex-wrap gap-2">
              {otherPages.map((page) => (
                <span
                  key={page}
                  className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Back button ── */}
        <div className="flex justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accentColor text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
          >
            <ArrowLeft size={16} />
            {t("back_home")}
          </Link>
        </div>
      </div>
    </main>
  )
}
