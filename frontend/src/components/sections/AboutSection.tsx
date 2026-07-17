"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import useScrollActive from "@/hooks/UseScrollActive"
import { useSectionStore } from "@/stores/Section"
import { useLanguageStore } from "@/stores/LanguageStore"
import { PROFILE } from "@/config/profile"
import { useResumeStatus } from "@/hooks/useResumeStatus"
import { BookOpen, Download, Radar } from "lucide-react"

const SITE_STACK = ["React", "TypeScript", "Spring Boot", "MySQL", "Redis"]

export default function AboutSection() {
  const t = useTranslations("about")
  const aboutPage = useTranslations("aboutPage")
  const { locale } = useLanguageStore()
  const { status: resumeStatus } = useResumeStatus()
  const hasResume = resumeStatus.uploaded && Boolean(resumeStatus.url)
  const sectionRef = useRef<HTMLElement>(null!)
  const aboutSectionOnView = useScrollActive(sectionRef)
  const { setSection } = useSectionStore()

  useEffect(() => {
    setSection(aboutSectionOnView ? "#about" : "#home")
  }, [aboutSectionOnView, setSection])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative bg-gray-100 px-6 py-16 dark:bg-[#161D1F] md:px-[5%]"
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-12 md:flex-row md:gap-16">
        <div className="relative h-[220px] w-[220px] shrink-0 md:h-[280px] md:w-[280px]">
          <div className="absolute -bottom-3 -right-3 h-full w-full bg-accentColor" />
          <Image
            src={PROFILE.avatarUrl}
            alt={PROFILE.displayName}
            fill
            unoptimized
            className="relative z-10 object-cover shadow-sm"
          />
        </div>

        <div key={locale} className="flex max-w-2xl flex-col items-start gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-accentColor">{t("title")}</p>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white md:text-4xl">
              {t("quote")}
            </h2>
          </div>
          <p className="leading-8 text-gray-700 dark:text-gray-300">{t("paragraph1")}</p>
          <div className="space-y-3 border-l-2 border-accentColor pl-5 text-sm leading-7 text-gray-700 dark:text-gray-300">
            <p><span className="font-semibold text-gray-900 dark:text-white">{t("edu_undergraduate_label")}</span>{t("edu_undergraduate")}</p>
            <p><span className="font-semibold text-gray-900 dark:text-white">{t("edu_graduate_label")}</span>{t("edu_graduate")}</p>
          </div>
          <div className="grid w-full gap-5 border-t border-gray-200 pt-6 dark:border-gray-700 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Radar size={16} className="text-accentColor" />
                {aboutPage("research_title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {PROFILE.researchFocus.map((item) => (
                  <span key={item} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <BookOpen size={16} className="text-accentColor" />
                {aboutPage("site_stack_title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {SITE_STACK.map((item) => (
                  <span key={item} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">{item}</span>
                ))}
              </div>
            </div>
          </div>
          {hasResume ? (
            <a href={resumeStatus.url || ""} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-accentColor px-4 py-2 text-sm font-semibold text-white">
              <Download size={15} />{aboutPage("btn_cv")}
            </a>
          ) : (
            <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-400 dark:border-gray-700">
              <Download size={15} />{aboutPage("resume_empty")}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
