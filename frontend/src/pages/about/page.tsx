"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Download, GraduationCap, MapPin, Radar } from "lucide-react"
import { useTranslations } from "next-intl"
import { PROFILE } from "@/config/profile"
import { useResumeStatus } from "@/hooks/useResumeStatus"

const RESEARCH_AREAS = ["Visual/LiDAR SLAM", "Robot Navigation"]
const SITE_STACK = ["React", "TypeScript", "Spring Boot", "MySQL", "Redis"]

export default function AboutPage() {
  const t = useTranslations("aboutPage")
  const { status: resumeStatus } = useResumeStatus()
  const hasResume = resumeStatus.uploaded && Boolean(resumeStatus.url)

  const education = [
    {
      period: "2022 - 2026",
      title: t("journey_0_title"),
      description: t("journey_0_desc"),
    },
    {
      period: t("journey_1_period"),
      title: t("journey_1_title"),
      description: t("journey_1_desc"),
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50 pt-[4.5rem] text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="px-[5%] py-14 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row">
          <div className="relative h-56 w-56 shrink-0 md:h-72 md:w-72">
            <div className="absolute inset-0 scale-110 rounded-full bg-accentColor/20 blur-2xl" />
            <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-accentColor/50 shadow-[0_0_40px_rgba(14,189,122,0.25)]">
              <Image src={PROFILE.avatarUrl} alt={PROFILE.displayName} fill priority unoptimized className="object-cover" />
            </div>
          </div>

          <div className="flex max-w-2xl flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <span className="rounded-full bg-accentColor/10 px-4 py-1.5 text-xs font-semibold text-accentColor">
              {t("hello")}
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              {PROFILE.displayName} <span className="text-accentColor">{PROFILE.englishName}</span>
            </h1>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{t("tagline")}</p>
            <p className="max-w-xl leading-7 text-gray-500 dark:text-gray-400">{t("hero_bio")}</p>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"><GraduationCap size={13} />{t("badge_edu")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"><MapPin size={13} />{t("badge_location")}</span>
            </div>
            {hasResume ? (
              <a href={resumeStatus.url || ""} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-accentColor px-5 py-2.5 text-sm font-semibold text-white">
                <Download size={15} />{t("btn_cv")}
              </a>
            ) : (
              <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm text-gray-400 dark:border-gray-700">
                <Download size={15} />{t("resume_empty")}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white px-[5%] py-16 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-semibold text-accentColor">{t("bio_label")}</p>
            <h2 className="mb-6 text-3xl font-bold">{t("bio_title")}</h2>
            <div className="space-y-4 leading-7 text-gray-600 dark:text-gray-400">
              <p>{t("bio_p1")}</p>
              <p>{t("bio_p2")}</p>
              <p><strong className="text-gray-900 dark:text-white">{t("research_prefix")}</strong> {t("bio_p3")}</p>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold">{t("info_title")}</p>
            <dl className="divide-y divide-gray-200 border-y border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              <InfoRow label={t("field_dob")} value={t("val_dob")} />
              <InfoRow label={t("field_origin")} value={<a className="text-accentColor hover:underline" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>} />
              <InfoRow label="GitHub" value={<Link className="text-accentColor hover:underline" href={PROFILE.githubUrl} target="_blank">github.com/promotesd</Link>} />
              <InfoRow label={t("field_edu")} value={t("val_edu")} />
              <InfoRow label={t("field_lang")} value={t("val_lang")} />
            </dl>
          </div>
        </div>
      </section>

      <section className="px-[5%] py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold text-accentColor">{t("journey_label")}</p>
            <h2 className="text-3xl font-bold">{t("journey_title")}</h2>
          </div>
          <div className="space-y-0 border-l-2 border-accentColor/40 pl-7">
            {education.map((item) => (
              <article key={item.period} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[34px] top-1 h-3 w-3 rounded-full bg-accentColor ring-4 ring-gray-50 dark:ring-gray-950" />
                <p className="mb-2 text-xs font-bold text-accentColor">{item.period}</p>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-7 text-gray-500 dark:text-gray-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-[5%] py-14 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <CompactList icon={<Radar size={18} />} title={t("research_title")} items={RESEARCH_AREAS} />
          <CompactList icon={<BookOpen size={18} />} title={t("site_stack_title")} items={SITE_STACK} />
        </div>
      </section>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 py-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-700 dark:text-gray-300">{value}</dd>
    </div>
  )
}

function CompactList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">{icon}{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">{item}</span>)}
      </div>
    </div>
  )
}
