"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  Download, Mail, MapPin, GraduationCap, Briefcase, Globe,
  Calendar, Star, Target, Rocket, Lightbulb,
  Code2, Zap, Users, MessageSquare, Clock, Brain, Palette,
  Music, Gamepad2, Camera, Coffee, BookOpen, Cat,
  Quote, ExternalLink, Award, CheckCircle2, Cpu,
} from "lucide-react";
import {
  SiReact, SiNextdotjs, SiTypescript, SiJavascript, SiTailwindcss,
  SiFramer, SiNodedotjs, SiFastapi, SiLaravel,
  SiPython, SiPhp, SiTensorflow, SiPytorch, SiScikitlearn,
  SiDocker, SiGit, SiGithub, SiLinux, SiVercel,
  SiMongodb, SiMysql, SiPostgresql, SiFirebase, SiOpenai,
  SiCplusplus, SiDjango, SiFlask, SiNestjs, SiExpress,
  SiHtml5, SiCss, SiRedux, SiGo, SiKeras, SiOpencv,
  SiFlutter, SiGooglecloud,
} from "react-icons/si";
import { FaMicrochip, FaAws as SiAmazon } from "react-icons/fa";
import ProfileImg from "@/assets/SAVE_20221213_123032 (1).jpg";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLanguageStore } from "@/stores/LanguageStore";
import TranslateWidget from "@/components/TranslateWidget";
import { fetchAboutStats, type AboutStats } from "@/lib/statsApi";
import { fetchCodingJourney, type CodingJourneyRow, fetchWorkExperiences, type WorkExperienceRow, fetchSkills, type SkillRow } from "@/lib/projectsApi";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────── helpers ─────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────── data ─────────────────────────── */

/* Static scaffold — icons + fallback values (replaced by Supabase/GitHub at runtime) */
const STATS_STATIC = [
  { fallback: 50, suffix: "+", icon: <Code2 size={22} /> },    // totalProjects
  { fallback: 4,  suffix: "+", icon: <Calendar size={22} /> }, // yearsExperience
  { fallback: 30, suffix: "+", icon: <Cpu size={22} /> },      // totalSkills
  { fallback: 8,  suffix: "+", icon: <Award size={22} /> },    // totalCertificates
];

const TIMELINE_STATIC = [
  { year: "2022", icon: <GraduationCap size={18} />, color: "from-blue-500 to-cyan-500" },
  { year: "2022", icon: <SiCplusplus size={18} />,  color: "from-cyan-500 to-teal-500" },
  { year: "2022", icon: <Code2 size={18} />,        color: "from-teal-500 to-green-500" },
  { year: "2022", icon: <Rocket size={18} />,       color: "from-green-500 to-emerald-500" },
  { year: "2023", icon: <Briefcase size={18} />,    color: "from-emerald-500 to-accentColor" },
  { year: "2024", icon: <Star size={18} />,         color: "from-yellow-500 to-orange-500" },
  { year: "2025", icon: <Globe size={18} />,        color: "from-orange-500 to-red-500" },
  { year: "2026", icon: <Briefcase size={18} />,    color: "from-red-500 to-pink-500" },
];

/**
 * Maps an icon_key string from the `skills` Supabase table to a React element.
 * Supports react-icons/si and react-icons/fa keys.
 * Falls back to <Code2> when the key is unrecognised.
 */
function getTechIcon(iconKey: string, color?: string, size = 24): React.ReactNode {
  const style = color ? { color } : {};
  const map: Record<string, React.ReactNode> = {
    // Frontend
    SiReact:       <SiReact       size={size} style={color ? style : { color: "#61DAFB" }} />,
    SiNextdotjs:   <SiNextdotjs   size={size} style={style} />,
    SiTypescript:  <SiTypescript  size={size} style={color ? style : { color: "#3178C6" }} />,
    SiJavascript:  <SiJavascript  size={size} style={color ? style : { color: "#F7DF1E" }} />,
    SiTailwindcss: <SiTailwindcss size={size} style={color ? style : { color: "#38BDF8" }} />,
    SiHtml5:       <SiHtml5       size={size} style={color ? style : { color: "#E34F26" }} />,
    SiCss:        <SiCss        size={size} style={color ? style : { color: "#1572B6" }} />,
    SiFramer:      <SiFramer      size={size} style={color ? style : { color: "#F859A2" }} />,
    SiRedux:       <SiRedux       size={size} style={color ? style : { color: "#764ABC" }} />,
    // Backend
    SiNodedotjs:   <SiNodedotjs   size={size} style={color ? style : { color: "#339933" }} />,
    SiExpress:     <SiExpress     size={size} style={style} />,
    SiNestjs:      <SiNestjs      size={size} style={color ? style : { color: "#E0234E" }} />,
    SiFastapi:     <SiFastapi     size={size} style={color ? style : { color: "#009688" }} />,
    SiFlask:       <SiFlask       size={size} style={style} />,
    SiDjango:      <SiDjango      size={size} style={color ? style : { color: "#092E20" }} />,
    SiGo:          <SiGo          size={size} style={color ? style : { color: "#00ADD8" }} />,
    SiLaravel:     <SiLaravel     size={size} style={color ? style : { color: "#FF2D20" }} />,
    SiPython:      <SiPython      size={size} style={color ? style : { color: "#F7D754" }} />,
    SiPhp:         <SiPhp         size={size} style={color ? style : { color: "#777BB4" }} />,
    // AI / ML
    SiTensorflow:  <SiTensorflow  size={size} style={color ? style : { color: "#FF6F00" }} />,
    SiKeras:       <SiKeras       size={size} style={color ? style : { color: "#D00000" }} />,
    SiPytorch:     <SiPytorch     size={size} style={color ? style : { color: "#EE4C2C" }} />,
    SiScikitlearn: <SiScikitlearn size={size} style={color ? style : { color: "#F7931E" }} />,
    SiOpencv:      <SiOpencv      size={size} style={color ? style : { color: "#5C3EE8" }} />,
    SiOpenai:      <SiOpenai      size={size} style={color ? style : { color: "#74AA9C" }} />,
    FaMicrochip:   <FaMicrochip   size={size} style={color ? style : { color: "#818CF8" }} />,
    // Mobile
    SiFlutter:     <SiFlutter     size={size} style={color ? style : { color: "#54C5F8" }} />,
    // DevOps & Tools
    SiDocker:      <SiDocker      size={size} style={color ? style : { color: "#2496ED" }} />,
    SiGit:         <SiGit         size={size} style={color ? style : { color: "#F05032" }} />,
    SiGithub:      <SiGithub      size={size} style={style} />,
    SiLinux:       <SiLinux       size={size} style={color ? style : { color: "#FCC624" }} />,
    SiVercel:      <SiVercel      size={size} style={style} />,
    // Database
    SiMongodb:     <SiMongodb     size={size} style={color ? style : { color: "#47A248" }} />,
    SiMysql:       <SiMysql       size={size} style={color ? style : { color: "#4479A1" }} />,
    SiPostgresql:  <SiPostgresql  size={size} style={color ? style : { color: "#4169E1" }} />,
    SiFirebase:    <SiFirebase    size={size} style={color ? style : { color: "#FFCA28" }} />,
    // Cloud
    SiGooglecloud: <SiGooglecloud size={size} style={color ? style : { color: "#4285F4" }} />,
    // C++ (journey icon reuse)
    SiCplusplus:   <SiCplusplus   size={size} style={style} />,
  };
  return map[iconKey] ?? <Code2 size={size} />;
}

/** Category display metadata for the Tech Stack section */
const CATEGORY_META: Record<string, { label: string; gradient: string; color: string; order: number }> = {
  frontend: { label: "Frontend",       gradient: "from-blue-500/20 to-cyan-500/10",     color: "text-blue-400",   order: 1 },
  backend:  { label: "Backend",        gradient: "from-green-500/20 to-emerald-500/10", color: "text-green-400",  order: 2 },
  database: { label: "Database",       gradient: "from-purple-500/20 to-pink-500/10",   color: "text-purple-400", order: 3 },
  devops:   { label: "DevOps & Tools", gradient: "from-orange-500/20 to-yellow-500/10", color: "text-orange-400", order: 4 },
  ai_ml:    { label: "AI / ML",        gradient: "from-pink-500/20 to-rose-500/10",     color: "text-pink-400",   order: 5 },
  mobile:   { label: "Mobile",         gradient: "from-teal-500/20 to-cyan-500/10",     color: "text-teal-400",   order: 6 },
  cloud:    { label: "Cloud",          gradient: "from-sky-500/20 to-blue-500/10",      color: "text-sky-400",    order: 7 },
};

/**
 * Maps an icon_key string from the coding_journey Supabase table to a
 * React element. Supports both lucide-react keys and react-icons/si keys.
 * Falls back to <Code2> when the key is unrecognised.
 */
function getJourneyIcon(iconKey: string, size = 18): React.ReactNode {
  const luc = { size };
  const map: Record<string, React.ReactNode> = {
    // lucide-react
    GraduationCap: <GraduationCap {...luc} />,
    Code2:         <Code2 {...luc} />,
    Rocket:        <Rocket {...luc} />,
    Briefcase:     <Briefcase {...luc} />,
    Star:          <Star {...luc} />,
    Globe:         <Globe {...luc} />,
    Calendar:      <Calendar {...luc} />,
    Target:        <Target {...luc} />,
    Lightbulb:     <Lightbulb {...luc} />,
    Zap:           <Zap {...luc} />,
    Brain:         <Brain {...luc} />,
    Award:         <Award {...luc} />,
    CheckCircle2:  <CheckCircle2 {...luc} />,
    Cpu:           <Cpu {...luc} />,
    // react-icons/si
    SiCplusplus:   <SiCplusplus size={size} />,
    SiReact:       <SiReact size={size} />,
    SiNextdotjs:   <SiNextdotjs size={size} />,
    SiTypescript:  <SiTypescript size={size} />,
    SiJavascript:  <SiJavascript size={size} />,
    SiTailwindcss: <SiTailwindcss size={size} />,
    SiNodedotjs:   <SiNodedotjs size={size} />,
    SiPython:      <SiPython size={size} />,
    SiDocker:      <SiDocker size={size} />,
    SiGit:         <SiGit size={size} />,
    SiGithub:      <SiGithub size={size} />,
  };
  return map[iconKey] ?? <Code2 {...luc} />;
}

/** Normalised shape used by the experience card renderer */
interface DisplayExperience {
  company:     string;
  position:    string;
  type:        string;
  period:      string;
  location:    string;
  description: string;
  stack:       string[];
}

/**
 * Formats start_date + optional end_date / is_current flag into
 * a human-readable period string (e.g. "Oct 2025 – Present").
 */
function formatExpPeriod(
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(startDate)} – ${isCurrent || !endDate ? "Present" : fmt(endDate)}`;
}

/** Static fallback — used when Supabase fetch fails or returns empty */
const EXPERIENCES_STATIC: DisplayExperience[] = [
  {
    company: "Charoen Pokphand Indonesia",
    position: "Information Communication Technology",
    period: "Oct 2025 – Present",
    location: "Kediri, East Java, Indonesia · On-site",
    description: "As an ICT Intern specialized in Mobile Development at Charoen Pokphand Indonesia, I am actively involved in the design, development, and maintenance of mobile applications that support the company's operational efficiency. I collaborate closely with the software engineering team to build user-friendly interfaces, write clean and maintainable code, and ensure seamless application performance across different devices.",
    stack: ["Flutter", "Firebase"],
    type: "Internship",
  },
  {
    company: "PT. BISI International, Tbk",
    position: "Mobile Developer",
    period: "Oct 2025 – Present",
    location: "Kediri, East Java, Indonesia · On-site",
    description: "As a Mobile Developer Intern at PT. BISI International, Tbk in Kediri, I contribute to the development of mobile applications designed to streamline agricultural operations and enhance business efficiency. I work closely with the engineering team to build scalable features, optimize application performance, and ensure a seamless user experience for field staff and internal users.",
    stack: ["Flutter", "Firebase"],
    type: "Internship",
  },
  {
    company: "CV Dharma Adi Putra",
    position: "Network Technician",
    period: "Apr 2020 – Present",
    location: "Kabupaten Banyuwangi, East Java, Indonesia · Hybrid",
    description: "As a Network Technician at CV Dharma Adi Putra, I am responsible for the comprehensive maintenance of server and network infrastructure across both office and field environments. I oversee the installation of new network systems tailored to client needs while expertly troubleshooting connectivity issues to ensure stable service. Working within a hybrid system, I manage both on-site operations and remote monitoring.",
    stack: ["Network Installation", "Network Troubleshooting", "Network Services"],
    type: "Part-time",
  },
  {
    company: "CV Dharma Adi Putra",
    position: "Full Stack Developer",
    period: "Apr 2020 – Oct 2025",
    location: "Banyuwangi, East Java, Indonesia · Remote",
    description: "As a Full Stack Developer at CV Dharma Adi Putra, I engineer web and mobile applications that are seamlessly integrated with Mikrotik network infrastructure. I focus on developing specialized solutions for financial management, including automated transaction processing and billing systems.",
    stack: ["Flutter", "Next.js", "PostgreSQL"],
    type: "Part-time",
  },
  {
    company: "JTI Innovation Center",
    position: "Web Developer",
    period: "Feb 2025 – Jul 2025",
    location: "Jember, East Java, Indonesia · On-site",
    description: "As a Web Developer at JTI Innovation Center, I play a key role in developing web-based applications that strictly adhere to client requirements and functional standards. I ensure comprehensive feature implementation across both frontend and backend layers. Leveraging the Laravel framework, I construct efficient, structured, and scalable systems.",
    stack: ["Laravel", "Next.js"],
    type: "Contract",
  },
  {
    company: "SOKO FINANCIAL",
    position: "Full Stack Developer",
    period: "Jun 2024 – Sep 2024",
    location: "Yogyakarta, Indonesia · Remote",
    description: "As a Full Stack Developer Intern at SOKO FINANCIAL, I contributed to the end-to-end development of the company's financial web platform. I was responsible for translating high-fidelity designs from the UI team into functional frontend code while managing complex backend logic on the client side.",
    stack: ["Laravel", "Tailwind CSS", "JavaScript"],
    type: "Internship",
  },
];

const techStackGroups = [
  {
    category: "Frontend",
    gradient: "from-blue-500/20 to-cyan-500/10",
    color: "text-blue-400",
    skills: [
      { name: "React", icon: <SiReact className="text-blue-400" />, level: 92 },
      { name: "Next.js", icon: <SiNextdotjs />, level: 90 },
      { name: "TypeScript", icon: <SiTypescript className="text-blue-600" />, level: 85 },
      { name: "JavaScript", icon: <SiJavascript className="text-yellow-400" />, level: 90 },
      { name: "Tailwind", icon: <SiTailwindcss className="text-sky-400" />, level: 93 },
      { name: "Framer", icon: <SiFramer className="text-pink-400" />, level: 76 },
    ],
  },
  {
    category: "Backend",
    gradient: "from-green-500/20 to-emerald-500/10",
    color: "text-green-400",
    skills: [
      { name: "Node.js", icon: <SiNodedotjs className="text-green-500" />, level: 83 },
      { name: "FastAPI", icon: <SiFastapi className="text-teal-400" />, level: 82 },
      { name: "Laravel", icon: <SiLaravel className="text-red-500" />, level: 80 },
      { name: "Python", icon: <SiPython className="text-yellow-400" />, level: 88 },
      { name: "PHP", icon: <SiPhp className="text-indigo-400" />, level: 75 },
      { name: "Django", icon: <SiDjango className="text-green-700" />, level: 74 },
      { name: "Flask", icon: <SiFlask className="text-gray-300" />, level: 72 },
      { name: "NestJS", icon: <SiNestjs className="text-red-500" />, level: 70 },
      { name: "Express", icon: <SiExpress className="text-gray-400" />, level: 78 },
    ],
  },
  {
    category: "Database",
    gradient: "from-purple-500/20 to-pink-500/10",
    color: "text-purple-400",
    skills: [
      { name: "MySQL", icon: <SiMysql className="text-blue-500" />, level: 85 },
      { name: "PostgreSQL", icon: <SiPostgresql className="text-blue-400" />, level: 80 },
      { name: "MongoDB", icon: <SiMongodb className="text-green-500" />, level: 75 },
      { name: "Firebase", icon: <SiFirebase className="text-yellow-500" />, level: 78 },
    ],
  },
  {
    category: "DevOps & Tools",
    gradient: "from-orange-500/20 to-yellow-500/10",
    color: "text-orange-400",
    skills: [
      { name: "Docker", icon: <SiDocker className="text-blue-500" />, level: 78 },
      { name: "Git", icon: <SiGit className="text-orange-500" />, level: 90 },
      { name: "GitHub", icon: <SiGithub />, level: 90 },
      { name: "Linux", icon: <SiLinux />, level: 80 },
      { name: "Vercel", icon: <SiVercel />, level: 85 },
    ],
  },
  {
    category: "AI / ML",
    gradient: "from-pink-500/20 to-rose-500/10",
    color: "text-pink-400",
    skills: [
      { name: "TensorFlow", icon: <SiTensorflow className="text-orange-500" />, level: 80 },
      { name: "PyTorch", icon: <SiPytorch className="text-orange-500" />, level: 72 },
      { name: "Scikit-Learn", icon: <SiScikitlearn className="text-yellow-500" />, level: 82 },
      { name: "OpenAI", icon: <SiOpenai />, level: 78 },
    ],
  },
];

const SOFT_SKILLS_STATIC = [
  { icon: <Brain size={28} />,        label: "Problem Solving",    color: "from-blue-500 to-cyan-500" },
  { icon: <Users size={28} />,        label: "Team Collaboration", color: "from-green-500 to-emerald-500" },
  { icon: <Zap size={28} />,          label: "Fast Learner",       color: "from-yellow-500 to-orange-500" },
  { icon: <MessageSquare size={28} />,label: "Communication",      color: "from-purple-500 to-pink-500" },
  { icon: <Palette size={28} />,      label: "Creative Thinking",  color: "from-pink-500 to-rose-500" },
  { icon: <Clock size={28} />,        label: "Time Management",    color: "from-teal-500 to-cyan-500" },
];

const GOALS_STATIC = [
  { type: "short",  icon: <Target size={22} />,   color: "from-blue-500 to-cyan-500" },
  { type: "long",   icon: <Rocket size={22} />,   color: "from-emerald-500 to-teal-500" },
  { type: "vision", icon: <Lightbulb size={22} />, color: "from-yellow-500 to-orange-500" },
];

const HOBBIES_STATIC = [
  { icon: <Gamepad2 size={32} />, label: "Gaming",       color: "from-purple-500 to-indigo-500" },
  { icon: <Music size={32} />,    label: "Music",        color: "from-pink-500 to-rose-500" },
  { icon: <Cat size={32} />,      label: "Cats",         color: "from-orange-400 to-yellow-400" },
  { icon: <Camera size={32} />,   label: "Photography",  color: "from-teal-500 to-cyan-500" },
  { icon: <Code2 size={32} />,    label: "Coding",       color: "from-green-500 to-emerald-500" },
  { icon: <Coffee size={32} />,   label: "Coffee",       color: "from-amber-600 to-yellow-500" },
  { icon: <BookOpen size={32} />, label: "Reading",      color: "from-blue-500 to-violet-500" },
  { icon: <Brain size={32} />,    label: "Explore Tech", color: "from-cyan-500 to-blue-500" },
];

const FUNFACTS_STATIC = [
  { num: "01" }, { num: "02" }, { num: "03" }, { num: "04" },
  { num: "05" }, { num: "06" }, { num: "07" }, { num: "08" },
];

const quotes = [
  {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay",
    role: "Computer Scientist",
  },
  {
    text: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House",
    role: "Software Architect",
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    role: "Software Developer",
  },
];

/* ─────────────────────────── sub-components ─────────────────────────── */

function SectionWrapper({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <section id={id} ref={ref} className={cn("py-20 px-[5%]", className)}>
      <div
        className={cn(
          "max-w-6xl mx-auto transition-all duration-700",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}
      >
        {children}
      </div>
    </section>
  );
}

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-12 text-center">
      <span className="text-xs font-semibold tracking-widest uppercase text-accentColor bg-accentColor/10 px-4 py-1.5 rounded-full">
        {label}
      </span>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <div ref={ref} className="text-4xl font-bold text-accentColor">
      {count}{suffix}
    </div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function AboutPage() {
  const t = useTranslations("aboutPage");
  const { locale } = useLanguageStore();

  // ── Dynamic stats from Supabase + GitHub ──────────────────────────────────
  const [dynamicStats, setDynamicStats] = useState<Partial<AboutStats>>({});

  useEffect(() => {
    fetchAboutStats()
      .then(setDynamicStats)
      .catch((err) => console.error("[AboutPage] fetchAboutStats error:", err));
  }, []);

  // ── Coding Journey from Supabase ──────────────────────────────────────────
  const [journeyData, setJourneyData] = useState<CodingJourneyRow[]>([]);
  // Per-card translate state: idx → { title, description }
  const [journeyTranslations, setJourneyTranslations] = useState<
    Record<number, { title: string; description: string }>
  >({});

  useEffect(() => {
    fetchCodingJourney()
      .then(setJourneyData)
      .catch((err) => console.error("[AboutPage] fetchCodingJourney error:", err));
  }, []);

  // ── Work Experiences from Supabase ────────────────────────────────────────
  const [experiencesData, setExperiencesData] = useState<WorkExperienceRow[]>([]);
  // Per-card translate state: idx → translated description string
  const [expTranslations, setExpTranslations] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchWorkExperiences()
      .then(setExperiencesData)
      .catch((err) => console.error("[AboutPage] fetchWorkExperiences error:", err));
  }, []);

  // ── Skills / Tech Stack from Supabase ─────────────────────────────────────
  const [skillsData, setSkillsData] = useState<SkillRow[]>([]);

  useEffect(() => {
    fetchSkills()
      .then(setSkillsData)
      .catch((err) => console.error("[AboutPage] fetchSkills error:", err));
  }, []);

  /**
   * Build grouped tech-stack data from Supabase rows.
   * Falls back to static `techStackGroups` when the fetch returns empty.
   */
  const dynamicTechGroups = skillsData.length > 0
    ? Object.entries(
        skillsData.reduce<Record<string, SkillRow[]>>((acc, row) => {
          (acc[row.category] ??= []).push(row);
          return acc;
        }, {})
      )
        .sort(([a], [b]) =>
          (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
        )
        .map(([cat, rows]) => {
          const meta = CATEGORY_META[cat] ?? {
            label: cat, gradient: "from-gray-500/20 to-gray-400/10", color: "text-gray-400", order: 99,
          };
          return {
            category: meta.label,
            gradient: meta.gradient,
            color:    meta.color,
            skills:   rows.map((r) => ({
              name:  r.name,
              icon:  getTechIcon(r.icon_key, r.icon_color),
              level: r.level,
            })),
          };
        })
    : techStackGroups;

  // Normalise Supabase rows → DisplayExperience; fall back to static when empty
  const displayExperiences: DisplayExperience[] = experiencesData.length > 0
    ? experiencesData.map((row) => ({
        company:     row.company,
        position:    row.position,
        type:        row.employment_type,
        period:      formatExpPeriod(row.start_date, row.end_date, row.is_current),
        location:    row.work_mode ? `${row.location} · ${row.work_mode}` : row.location,
        description: row.description,
        stack:       row.tech_stack,
      }))
    : EXPERIENCES_STATIC;

  // Build translated + dynamic stats — use fetched value when available,
  // fall back to static scaffold until the request resolves.
  const STAT_KEYS: (keyof AboutStats)[] = [
    "totalProjects",
    "yearsExperience",
    "totalSkills",
    "totalCertificates",
  ];

  const stats = STATS_STATIC.map((s, i) => ({
    ...s,
    value: (dynamicStats[STAT_KEYS[i]] as number | undefined) ?? s.fallback,
    label: t(`stat_${i}` as never),
  }));

  // Use Supabase rows when available; fall back to static scaffold + i18n text.
  const timeline = journeyData.length > 0
    ? journeyData.map((item) => ({
        year:        item.year,
        title:       item.title,
        description: item.description,
        color:       item.color,
        icon:        getJourneyIcon(item.icon_key),
      }))
    : TIMELINE_STATIC.map((item, i) => ({
        ...item,
        title:       t(`journey_${i}_title` as never),
        description: t(`journey_${i}_desc` as never),
      }));

  const softSkills = SOFT_SKILLS_STATIC.map((s, i) => ({
    ...s,
    desc: t(`soft_${i}_desc` as never),
  }));

  const goals = [
    {
      ...GOALS_STATIC[0],
      title: t("goal_short_title"),
      items: [t("goal_short_0"), t("goal_short_1"), t("goal_short_2"), t("goal_short_3")],
    },
    {
      ...GOALS_STATIC[1],
      title: t("goal_long_title"),
      items: [t("goal_long_0"), t("goal_long_1"), t("goal_long_2"), t("goal_long_3")],
    },
    {
      ...GOALS_STATIC[2],
      title: t("goal_vision_title"),
      items: [t("goal_vision_0"), t("goal_vision_1"), t("goal_vision_2"), t("goal_vision_3")],
    },
  ];

  const hobbies = HOBBIES_STATIC.map((h, i) => ({
    ...h,
    desc: t(`hobby_${i}_desc` as never),
  }));

  const funFacts = FUNFACTS_STATIC.map((f, i) => ({
    ...f,
    fact: t(`fact_${i}` as never),
  }));

  const heroRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");

  // Typing animation — resets on locale change
  useEffect(() => {
    setTypedText("");
    let i = 0;
    const taglineStr = t("tagline");
    const interval = setInterval(() => {
      setTypedText(taglineStr.slice(0, i + 1));
      i++;
      if (i >= taglineStr.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hero entrance animation
  useEffect(() => {
    if (!heroRef.current) return;
    const q = gsap.utils.selector(heroRef.current);
    gsap.fromTo(
      q(".hero-el"),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power2.out", delay: 0.3 }
    );
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pt-[4.5rem]">
      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO PROFILE                      */}
      {/* ══════════════════════════════════════════════ */}
      <section id="hero" className="py-16 px-[5%]">
        <div ref={heroRef} className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Profile Image */}
            <div className="hero-el flex-shrink-0 relative">
              <div className="relative w-56 h-56 md:w-72 md:h-72">
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accentColor/40 to-cyan-400/20 blur-2xl scale-110" />
                <div className="absolute inset-0 rounded-full border-2 border-accentColor/40 animate-pulse" />
                <div className="absolute -inset-2 rounded-full border border-accentColor/20" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-accentColor/50 shadow-[0_0_40px_rgba(14,189,122,0.3)]">
                  <Image
                    src={ProfileImg}
                    alt="Agung Kurniawan"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Online badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white dark:bg-gray-900 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                  <span className="w-2 h-2 rounded-full bg-accentColor animate-pulse" />
                  <span className="text-gray-700 dark:text-gray-300">{t("badge_open")}</span>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 flex-1">
              <div className="hero-el">
                <span className="text-xs font-semibold tracking-widest uppercase text-accentColor bg-accentColor/10 px-4 py-1.5 rounded-full">
                  {t("hello")}
                </span>
              </div>
              <h1 className="hero-el text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Agung{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentColor to-cyan-400">
                  Kurniawan
                </span>
              </h1>
              <div className="hero-el h-8 flex items-center">
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium">
                  {typedText}
                  <span className="inline-block w-0.5 h-5 bg-accentColor ml-0.5 animate-pulse" />
                </p>
              </div>
              <p className="hero-el text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                {t("hero_bio")}
              </p>

              {/* Status badges */}
              <div className="hero-el flex flex-wrap gap-2 justify-center lg:justify-start">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t("badge_role")}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full">
                  <MapPin size={11} />
                  {t("badge_location")}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full">
                  <GraduationCap size={11} />
                  {t("badge_edu")}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="hero-el flex flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="/resume.pdf"
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accentColor text-white font-semibold text-sm shadow-[0_0_20px_rgba(14,189,122,0.4)] hover:shadow-[0_0_30px_rgba(14,189,122,0.6)] hover:scale-105 transition-all duration-200"
                >
                  <Download size={16} />
                  {t("btn_cv")}
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-accentColor/40 text-accentColor font-semibold text-sm hover:bg-accentColor/10 transition-all duration-200 hover:scale-105"
                >
                  <Mail size={16} />
                  {t("btn_contact")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 2 — BIO & PERSONAL INFO               */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="bio">
        <SectionTitle
          label={t("bio_label")}
          title={t("bio_title")}
          subtitle={t("bio_subtitle")}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bio narrative */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t("who_title")}</h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>{t("bio_p1")}</p>
              <p>{t("bio_p2")}</p>
              <p>{t("bio_p3")}</p>
              <p>{t("bio_p4")}</p>
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t("info_title")}</h3>
            <ul className="space-y-4">
              {[
                { icon: <Calendar size={18} className="text-accentColor" />, label: t("field_dob"), value: t("val_dob") },
                { icon: <MapPin size={18} className="text-accentColor" />, label: t("field_origin"), value: t("val_origin") },
                { icon: <GraduationCap size={18} className="text-accentColor" />, label: t("field_edu"), value: t("val_edu") },
                { icon: <Briefcase size={18} className="text-accentColor" />, label: t("field_work"), value: t("val_work") },
                { icon: <Globe size={18} className="text-accentColor" />, label: t("field_lang"), value: t("val_lang") },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-4">
                  <span className="mt-0.5 p-2 rounded-lg bg-accentColor/10 shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 3 — STATS                             */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="stats" className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-950">
        <SectionTitle label={t("stats_label")} title={t("stats_title")} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 text-center shadow-sm hover:border-accentColor/40 hover:shadow-[0_4px_20px_rgba(14,189,122,0.15)] transition-all duration-300 group"
            >
              <div className="flex justify-center mb-3 text-accentColor opacity-70 group-hover:opacity-100 transition-opacity">
                {stat.icon}
              </div>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 4 — LEARNING JOURNEY TIMELINE         */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="journey">
        <SectionTitle
          label={t("journey_label")}
          title={t("journey_title")}
          subtitle={t("journey_subtitle")}
        />
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-accentColor/60 via-accentColor/20 to-transparent hidden sm:block" />
          <div className="space-y-8">
            {timeline.map((item, idx) => {
              const displayTitle       = journeyTranslations[idx]?.title       ?? item.title;
              const displayDescription = journeyTranslations[idx]?.description ?? item.description;
              return (
                <div key={idx} className="flex gap-6 group">
                  {/* Icon circle */}
                  <div className="relative shrink-0 hidden sm:block">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white bg-gradient-to-br", item.color, "shadow-lg shadow-accentColor/20 group-hover:scale-110 transition-transform duration-300")}>
                      {item.icon}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm group-hover:border-accentColor/30 transition-colors duration-300">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-accentColor bg-accentColor/10 px-2.5 py-1 rounded-full">{item.year}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{displayTitle}</h3>
                      <TranslateWidget
                        fields={{ title: item.title, description: item.description }}
                        onTranslated={(out) =>
                          setJourneyTranslations((prev) => ({
                            ...prev,
                            [idx]: { title: out.title, description: out.description },
                          }))
                        }
                        onReverted={() =>
                          setJourneyTranslations((prev) => {
                            const next = { ...prev };
                            delete next[idx];
                            return next;
                          })
                        }
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{displayDescription}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 5 — WORK EXPERIENCE                   */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="experience" className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-950">
        <SectionTitle
          label={t("exp_label")}
          title={t("exp_title")}
          subtitle={t("exp_subtitle")}
        />
        <div className="space-y-6 max-w-4xl mx-auto">
          {displayExperiences.map((exp, idx) => {
            const displayDesc = expTranslations[idx] ?? exp.description;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-accentColor/40 hover:shadow-[0_4px_30px_rgba(14,189,122,0.12)] transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Company initial badge */}
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-accentColor/20 to-cyan-500/20 flex items-center justify-center text-accentColor font-bold text-xl border border-accentColor/20">
                    {exp.company[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex-1">{exp.position}</h3>
                      <span className={cn(
                        "text-xs font-medium px-2.5 py-0.5 rounded-full",
                        exp.type === "Internship"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : exp.type === "Contract"
                          ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          : exp.type === "Part-time"
                          ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                          : exp.type === "Freelance"
                          ? "bg-teal-500/10 text-teal-500 border border-teal-500/20"
                          : "bg-green-500/10 text-green-500 border border-green-500/20"
                      )}>
                        {exp.type}
                      </span>
                    </div>
                    <p className="text-accentColor font-medium text-sm mb-1">{exp.company}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar size={11} />{exp.period}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{exp.location}</span>
                    </div>
                    <div className="flex items-start gap-2 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{displayDesc}</p>
                      <TranslateWidget
                        fields={{ description: exp.description }}
                        onTranslated={(out) =>
                          setExpTranslations((prev) => ({ ...prev, [idx]: out.description }))
                        }
                        onReverted={() =>
                          setExpTranslations((prev) => {
                            const next = { ...prev };
                            delete next[idx];
                            return next;
                          })
                        }
                        size="sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exp.stack.map((tech) => (
                        <span key={tech} className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 6 — TECH STACK                        */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="techstack">
        <SectionTitle
          label={t("tech_label")}
          title={t("tech_title")}
          subtitle={t("tech_subtitle")}
        />
        <div className="space-y-8">
          {dynamicTechGroups.map((group) => (
            <div key={group.category}>
              <h3 className={cn("text-sm font-semibold tracking-widest uppercase mb-4", group.color)}>{group.category}</h3>
              <div className={cn("bg-gradient-to-br rounded-2xl p-6 border border-gray-200 dark:border-gray-800", group.gradient)}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {group.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="group flex flex-col items-center gap-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur rounded-xl p-3 border border-white/50 dark:border-gray-700/50 hover:border-accentColor/50 hover:scale-105 hover:shadow-[0_4px_16px_rgba(14,189,122,0.2)] transition-all duration-200 cursor-default"
                    >
                      <span className="text-2xl flex items-center justify-center w-8 h-8">{skill.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{skill.name}</span>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-accentColor to-cyan-400 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">{skill.level}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 7 — SOFT SKILLS                       */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="softskills" className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-950">
        <SectionTitle
          label={t("soft_label")}
          title={t("soft_title")}
          subtitle={t("soft_subtitle")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {softSkills.map((skill) => (
            <div
              key={skill.label}
              className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-accentColor/40 hover:shadow-[0_8px_30px_rgba(14,189,122,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4", skill.color)}>
                {skill.icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{skill.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{skill.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 8 — GOALS & VISION                    */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="goals">
        <SectionTitle
          label={t("goals_label")}
          title={t("goals_title")}
          subtitle={t("goals_subtitle")}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {goals.map((g) => (
            <div
              key={g.type}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-accentColor/40 transition-all duration-300"
            >
              <div className={cn("inline-flex items-center gap-2 text-white text-sm font-semibold bg-gradient-to-r px-4 py-2 rounded-xl mb-4", g.color)}>
                {g.icon}
                {g.title}
              </div>
              <ul className="space-y-3">
                {g.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={15} className="text-accentColor shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 9 — HOBBIES                           */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="hobbies" className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-950">
        <SectionTitle
          label={t("hobbies_label")}
          title={t("hobbies_title")}
          subtitle={t("hobbies_subtitle")}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {hobbies.map((h) => (
            <div
              key={h.label}
              className="group bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 text-center shadow-sm hover:border-accentColor/50 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(14,189,122,0.2)] transition-all duration-300 cursor-default"
            >
              <div className={cn("w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300", h.color)}>
                {h.icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{h.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 10 — FUN FACTS                        */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="funfacts">
        <SectionTitle
          label={t("facts_label")}
          title={t("facts_title")}
          subtitle={t("facts_subtitle")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {funFacts.map((f) => (
            <div
              key={f.num}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-accentColor/50 hover:shadow-[0_8px_25px_rgba(14,189,122,0.18)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <span className="absolute -top-3 -right-2 text-7xl font-black text-gray-100 dark:text-gray-800/60 select-none leading-none group-hover:text-accentColor/10 transition-colors duration-300">
                {f.num}
              </span>
              <p className="relative text-sm text-gray-600 dark:text-gray-400 leading-relaxed z-10">{f.fact}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════ */}
      {/* SECTION 11 — FAVORITE QUOTES                  */}
      {/* ══════════════════════════════════════════════ */}
      <SectionWrapper id="quotes" className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-950">
        <SectionTitle
          label={t("quotes_label")}
          title={t("quotes_title")}
          subtitle={t("quotes_subtitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-accentColor/40 hover:shadow-[0_8px_30px_rgba(14,189,122,0.15)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-accentColor/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <Quote size={32} className="text-accentColor/20 mb-4" />
              <blockquote className="relative text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic mb-5">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accentColor to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {q.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.author}</p>
                  <p className="text-xs text-gray-400">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ── CTA Footer ── */}
      <section className="py-16 px-[5%] text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t("cta_title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t("cta_desc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accentColor text-white font-semibold text-sm shadow-[0_0_20px_rgba(14,189,122,0.4)] hover:shadow-[0_0_30px_rgba(14,189,122,0.6)] hover:scale-105 transition-all duration-200"
            >
              <Mail size={16} />
              {t("btn_reach")}
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:border-accentColor/50 hover:text-accentColor hover:scale-105 transition-all duration-200"
            >
              <ExternalLink size={16} />
              {t("btn_projects")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
