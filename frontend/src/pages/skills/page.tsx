"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  SiReact, SiNextdotjs, SiTypescript, SiJavascript, SiTailwindcss,
  SiHtml5, SiCss, SiFramer, SiNodedotjs, SiFastapi, SiLaravel,
  SiPython, SiPhp, SiTensorflow, SiKeras, SiPytorch, SiScikitlearn,
  SiOpencv, SiFlutter, SiDocker, SiGit, SiGithub, SiLinux, SiVercel,
  SiMongodb, SiMysql, SiPostgresql, SiFirebase,  SiGooglecloud,
  SiRedux, SiOpenai, SiGo, SiFlask, SiDjango, SiExpress, SiNestjs,
  SiRust, SiSwift, SiKotlin, SiElixir, SiRuby, SiScala, SiCplusplus,
  SiRedis, SiElasticsearch, SiGraphql, SiKubernetes, SiJenkins,
  SiGitlab, SiBitbucket, SiNginx, SiApache, SiRabbitmq, SiApachekafka,
  SiSqlite, SiMariadb,
  SiDigitalocean, SiCloudflare, SiHeroku, SiNetlify,
} from "react-icons/si";
import {
  FaMicrochip, FaBrain, FaServer, FaDatabase, FaCloud,
  FaMobileAlt, FaTools, FaLayerGroup, FaCode, FaAws as SiAmazon,
} from "react-icons/fa";
import { Code2 } from "lucide-react";
import { ReactNode } from "react";
import { fetchSkills, type SkillRow } from "@/lib/projectsApi";
import { fetchAboutStats } from "@/lib/statsApi";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────── icon mapping ─────────────────────── */

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  SiReact, SiNextdotjs, SiTypescript, SiJavascript, SiTailwindcss,
  SiHtml5, SiCss, SiFramer, SiNodedotjs, SiFastapi, SiLaravel,
  SiPython, SiPhp, SiTensorflow, SiKeras, SiPytorch, SiScikitlearn,
  SiOpencv, SiFlutter, SiDocker, SiGit, SiGithub, SiLinux, SiVercel,
  SiMongodb, SiMysql, SiPostgresql, SiFirebase,  SiGooglecloud,
  SiRedux, SiOpenai, SiGo, SiFlask, SiDjango, SiExpress, SiNestjs,
  SiRust, SiSwift, SiKotlin, SiElixir, SiRuby, SiScala, SiCplusplus,
  SiRedis, SiElasticsearch, SiGraphql, SiKubernetes, SiJenkins,
  SiGitlab, SiBitbucket, SiNginx, SiApache, SiRabbitmq, SiApachekafka,
  SiSqlite, SiMariadb,
  SiDigitalocean, SiCloudflare, SiHeroku, SiNetlify,
  FaMicrochip, FaBrain, FaServer, FaDatabase, FaCloud,
  FaMobileAlt, FaTools, FaLayerGroup, FaCode,
};

function getSkillIcon(iconKey: string, color?: string, size = 20): ReactNode {
  const Component = ICON_COMPONENTS[iconKey];
  if (!Component) return <Code2 size={size} style={color ? { color } : {}} />;
  return <Component size={size} style={color ? { color } : {}} />;
}

/* ─────────────────────────── category metadata ────────────────── */

const CATEGORY_ORDER = ["frontend", "backend", "ai_ml", "mobile", "devops", "database", "cloud"] as const;
type CategoryId = (typeof CATEGORY_ORDER)[number];

const CATEGORY_STYLE: Record<CategoryId, { gradient: string; headerIcon: ReactNode; i18nKey: string }> = {
  frontend:  { gradient: "from-blue-500/20 to-cyan-500/10",     headerIcon: <SiReact       className="text-blue-400"   size={22} />, i18nKey: "cat_frontend" },
  backend:   { gradient: "from-green-500/20 to-emerald-500/10", headerIcon: <SiNodedotjs   className="text-green-500"  size={22} />, i18nKey: "cat_backend"  },
  ai_ml:     { gradient: "from-purple-500/20 to-pink-500/10",   headerIcon: <FaBrain       className="text-purple-400" size={22} />, i18nKey: "cat_aiml"     },
  mobile:    { gradient: "from-teal-500/20 to-cyan-500/10",     headerIcon: <SiFlutter     className="text-blue-400"   size={22} />, i18nKey: "cat_mobile"   },
  devops:    { gradient: "from-orange-500/20 to-yellow-500/10", headerIcon: <SiDocker      className="text-blue-500"   size={22} />, i18nKey: "cat_devops"   },
  database:  { gradient: "from-red-500/20 to-pink-500/10",      headerIcon: <SiPostgresql  className="text-blue-400"   size={22} />, i18nKey: "cat_database" },
  cloud:     { gradient: "from-sky-500/20 to-blue-500/10",      headerIcon: <SiGooglecloud className="text-blue-400"   size={22} />, i18nKey: "cat_cloud"    },
};

/* ─────────────────────────── types ────────────────────────────── */

type SkillItem = {
  id: string;
  name: string;
  iconKey: string;
  iconColor: string;
  level: number;
};

type CategoryGroup = {
  id: CategoryId;
  title: string;
  description: string;
  gradient: string;
  icon: ReactNode;
  skills: SkillItem[];
};

const getLevelColor = (level: number) => {
  if (level >= 90) return "text-[#0acf83]";
  if (level >= 80) return "text-blue-400";
  if (level >= 70) return "text-yellow-400";
  return "text-gray-400";
};

/* ─────────────────────────── components ─────────────────────── */

function SkillBar({ level, delay }: { level: number; delay: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { width: "0%" },
      {
        width: `${level}%`,
        duration: 1.2,
        ease: "power2.out",
        delay,
        scrollTrigger: {
          trigger: barRef.current,
          start: "top 90%",
          once: true,
        },
      }
    );
  }, [level, delay]);

  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
      <div
        ref={barRef}
        style={{ width: 0 }}
        className="h-full rounded-full bg-gradient-to-r from-[#0acf83] to-[#05a265]"
      />
    </div>
  );
}

function SkillCard({ skill, index, levelLabel }: { skill: SkillItem; index: number; levelLabel: string }) {
  return (
    <div
      className="skill-card group flex flex-col gap-3 p-4 rounded-xl
        bg-white dark:bg-white/5
        border border-gray-100 dark:border-white/10
        hover:border-[#0acf83]/40 dark:hover:border-[#0acf83]/40
        hover:shadow-md hover:shadow-[#0acf83]/10
        transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{getSkillIcon(skill.iconKey, skill.iconColor, 20)}</span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {skill.name}
          </span>
        </div>
        <span className={`text-[11px] font-semibold ${getLevelColor(skill.level)}`}>
          {levelLabel}
        </span>
      </div>
      <SkillBar level={skill.level} delay={index * 0.05} />
      <span className="text-[11px] text-gray-400 dark:text-white/40 self-end">
        {skill.level}%
      </span>
    </div>
  );
}

function CategorySection({ cat, getLevelLabel }: { cat: CategoryGroup; getLevelLabel: (level: number) => string }) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.fromTo(
      sectionRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );
  }, []);

  return (
    <div ref={sectionRef} className="opacity-0">
      {/* Category header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${cat.gradient}
            border border-white/10 dark:border-white/5 shrink-0`}
        >
          {cat.icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {cat.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
            {cat.description}
          </p>
        </div>
      </div>

      {/* Skill cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cat.skills.map((skill, i) => (
          <SkillCard key={skill.id} skill={skill} index={i} levelLabel={getLevelLabel(skill.level)} />
        ))}
      </div>
    </div>
  );
}
/* Skeleton loader — shown while data is fetching */
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
      <div className="h-2.5 w-8 rounded bg-gray-200 dark:bg-white/10 self-end" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-3 w-48 rounded bg-gray-200 dark:bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
/* ─────────────────────────── page ───────────────────────────── */

export default function SkillsPage() {
  const t = useTranslations("skillsPage");
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [yearsExperience, setYearsExperience] = useState(4);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Data fetching ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchSkills(), fetchAboutStats()]).then(([skillsRes, statsRes]) => {
      if (cancelled) return;

      if (skillsRes.status === "fulfilled") {
        setSkills(skillsRes.value);
      } else {
        console.error("[SkillsPage] fetchSkills error:", skillsRes.reason);
      }

      if (statsRes.status === "fulfilled") {
        setYearsExperience(statsRes.value.yearsExperience);
      } else {
        console.error("[SkillsPage] fetchAboutStats error:", statsRes.reason);
      }

      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  /* ── Group skills into categories ─────────────────────────── */
  const categories = useMemo<CategoryGroup[]>(() => {
    const grouped: Partial<Record<CategoryId, SkillItem[]>> = {};

    for (const skill of skills) {
      const catId = skill.category as CategoryId;
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId]!.push({
        id: skill.id,
        name: skill.name,
        iconKey: skill.icon_key,
        iconColor: skill.icon_color,
        level: skill.level,
      });
    }

    return CATEGORY_ORDER
      .filter((catId) => grouped[catId] && grouped[catId]!.length > 0)
      .map((catId) => {
        const style = CATEGORY_STYLE[catId];
        return {
          id: catId,
          title: t(`${style.i18nKey}_title` as Parameters<typeof t>[0]),
          description: t(`${style.i18nKey}_desc` as Parameters<typeof t>[0]),
          gradient: style.gradient,
          icon: style.headerIcon,
          skills: grouped[catId]!,
        };
      });
  }, [skills, t]);

  /* ── Derived stats — all sourced from Supabase ───────────────── */
  // count(*) WHERE is_published = true  FROM skills
  const totalTechnologies = skills.length;
  // distinct category values present in the fetched skills
  const totalCategories   = categories.length;
  // skills with level >= 90 (Expert tier)
  const expertCount       = skills.filter((s) => s.level >= 90).length;
  // yearsExperience → portfolio_stats.years_experience via fetchAboutStats

  const getLevelLabel = (level: number) => {
    if (level >= 90) return t("level_expert");
    if (level >= 80) return t("level_advanced");
    if (level >= 70) return t("level_proficient");
    return t("level_familiar");
  };

  /* ── Hero GSAP animation — fires once Supabase data is ready ───── */
  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-title span",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-sub",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(
        ".back-btn",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" }
      );
      document.querySelectorAll(".stat-num").forEach((el) => {
        const target = parseInt((el as HTMLElement).dataset.target || "0", 10);
        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.5,
            delay: 0.6,
            snap: { innerText: 1 },
            ease: "power2.out",
          }
        );
      });
    }, heroRef);
    return () => ctx.revert();
  }, [isLoading]);

  const stats = [
    { id: "technologies", label: t("stat_technologies"), value: totalTechnologies },
    { id: "categories",   label: t("stat_categories"),   value: totalCategories   },
    { id: "expert",       label: t("stat_expert"),        value: expertCount       },
    { id: "experience",   label: t("stat_experience"),    value: yearsExperience   },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0d1417] pt-[4.5rem]">
      {/* ── Hero ── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-white dark:bg-[#111a1d] border-b border-gray-100 dark:border-white/5"
      >
        {/* background decoration */}
        <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#0acf83]/10 blur-[80px]" />
          <div className="absolute bottom-0 -left-20 w-[20rem] h-[20rem] rounded-full bg-[#0acf83]/8 blur-[60px]" />
        </div>

        <div className="relative max-w-[1100px] mx-auto px-[5%] py-16">
          {/* title */}
          <div className="hero-title overflow-hidden flex flex-wrap gap-x-3 text-4xl md:text-5xl lg:text-[3.4rem] font-semibold tracking-tight text-gray-900 dark:text-white leading-tight mb-5">
            {[t("hero_title_1"), t("hero_title_2"), t("hero_title_3"), t("hero_title_4")]
              .filter(Boolean)
              .map((word, index) => (
                <span key={`${word}-${index}`} className={cn("inline-block", index === 1 && "text-[#0acf83]")}>
                  {word}
                </span>
              ))}
          </div>

          {t("hero_sub") && (
            <p className="hero-sub max-w-xl text-gray-500 dark:text-white/50 text-base md:text-lg leading-relaxed mb-10">
              {t("hero_sub")}
            </p>
          )}

          {/* quick stats — all values from Supabase */}
          <div ref={statsRef} className="flex flex-wrap gap-6 sm:gap-10">
            {stats.map((stat) => (
              <div key={stat.id} className="flex flex-col">
                {isLoading ? (
                  <div className="h-9 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-1" />
                ) : (
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    <span className="stat-num" data-target={stat.value}>0</span>
                    <span className="text-[#0acf83]">+</span>
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-white/40 mt-0.5 font-medium tracking-wide uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="max-w-[1100px] mx-auto px-[5%] pt-10 pb-2">
        <div className="flex flex-wrap gap-4">
          {[
            { label: t("level_expert"),     color: "bg-[#0acf83]", min: "90%+" },
            { label: t("level_advanced"),   color: "bg-blue-400",  min: "80%+" },
            { label: t("level_proficient"), color: "bg-yellow-400",min: "70%+" },
            { label: t("level_familiar"),   color: "bg-gray-400",  min: "<70%" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10"
            >
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs font-medium text-gray-600 dark:text-white/60">
                {item.label}
              </span>
              <span className="text-xs text-gray-400 dark:text-white/30">
                {item.min}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category sections ── */}
      <div className="max-w-[1100px] mx-auto px-[5%] py-12 flex flex-col gap-14">
        {isLoading
          ? CATEGORY_ORDER.map((id) => <SkeletonSection key={id} />)
          : categories.length > 0
            ? categories.map((cat) => (
              <CategorySection key={cat.id} cat={cat} getLevelLabel={getLevelLabel} />
            ))
            : (
              <div className="text-center py-20 text-gray-500 dark:text-white/50">
                <p className="text-xl font-semibold mb-2">{t('no_data_title')}</p>
                <p>{t('no_data_desc')}</p>
              </div>
            )}
      </div>

      {/* ── CTA footer ── */}
      <div className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#111a1d]">
        <div className="max-w-[1100px] mx-auto px-[5%] py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("cta_title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
              {t("cta_desc")}
            </p>
          </div>
          <Link
            href="/#contact"
            className="contact_me_btn relative px-7 py-3 text-white text-sm font-semibold rounded-md shrink-0"
          >
            <div className="contact_me_btn_overlay" />
            <span className="relative z-10">{t("cta_btn")}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
