"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import {
  SiYoutube,
  SiTiktok,
  SiSpotify,
  SiInstagram,
  SiWhatsapp,
  SiTelegram,
  SiSteam,
  SiPinterest,
  SiFacebook,
  SiGmail,
  SiGithub,
} from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import {
  FaArrowLeft,
  FaExternalLinkAlt,
  FaLinkedin as SiLinkedin,
  FaPaperPlane,
  FaStar,
} from "react-icons/fa";
import { ReactNode } from "react";
import emailjs from "@emailjs/browser";
import { PROFILE } from "@/config/profile";
import { env } from "@/config/env";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────── EmailJS Config ─────────────────── */
const EMAILJS_SERVICE_ID  = env.emailjsServiceId || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = env.emailjsContactTemplateId || env.emailjsTemplateId || "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = env.emailjsPublicKey || "YOUR_PUBLIC_KEY";

/* ─────────────────── Toast ─────────────────── */
type ToastType = "success" | "error";

function Toast({ message, type, onDone }: { message: string; type: ToastType; onDone: () => void }) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toastRef.current) return;
    gsap.fromTo(toastRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
    const t = setTimeout(() => {
      gsap.to(toastRef.current, { y: 40, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: onDone });
    }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      ref={toastRef}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold pointer-events-none select-none ${
        type === "success" ? "bg-accentColor" : "bg-red-500"
      }`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────── Types ─────────────────── */

interface SocialPlatform {
  id: string;
  platform: string;
  handle: string;
  url: string;
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  labelBg: string;
  sublabel?: string;
  badge?: string;
}

interface SocialGroup {
  id: string;
  title: string;
  emoji: string;
  platforms: SocialPlatform[];
}

/* ─────────────────── Social Data ─────────────────── */

const socialGroups: SocialGroup[] = [
  {
    id: "contact",
    title: "GitHub & Email",
    emoji: "✉️",
    platforms: [
      {
        id: "github",
        platform: "GitHub",
        handle: "@promotesd",
        url: PROFILE.githubUrl,
        icon: <SiGithub size={28} />,
        bgColor: "from-gray-600/20 to-gray-900/10",
        textColor: "text-gray-900 dark:text-white",
        borderColor: "border-gray-500/30",
        glowColor: "hover:shadow-gray-500/20",
        labelBg: "bg-gray-900",
        badge: "Code",
      },
      {
        id: "email",
        platform: "Email",
        handle: PROFILE.email,
        url: `mailto:${PROFILE.email}`,
        icon: <SiGmail size={28} />,
        bgColor: "from-red-500/20 to-orange-500/10",
        textColor: "text-red-500",
        borderColor: "border-red-500/30",
        glowColor: "hover:shadow-red-500/20",
        labelBg: "bg-red-500",
        badge: "Email",
      },
    ],
  },
];

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accentColor/40"
          aria-label={`Rate ${star}`}
        >
          <FaStar
            size={20}
            className={star <= value ? "text-yellow-400" : "text-gray-300 dark:text-gray-700"}
          />
        </button>
      ))}
    </div>
  );
}

function SocialCard({ platform, index }: { platform: SocialPlatform; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        delay: index * 0.05,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          once: true,
        },
      }
    );
  }, [index]);

  return (
    <a
      ref={cardRef}
      href={platform.url}
      target={platform.url.startsWith("http") ? "_blank" : undefined}
      rel={platform.url.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`group relative overflow-hidden rounded-2xl border ${platform.borderColor} bg-gradient-to-br ${platform.bgColor} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${platform.glowColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`shrink-0 ${platform.textColor}`}>{platform.icon}</div>
        {platform.badge && (
          <span className={`${platform.labelBg} text-white text-[10px] font-semibold px-2 py-1 rounded-full`}>
            {platform.badge}
          </span>
        )}
      </div>
      <div className="mt-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{platform.platform}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-all">{platform.handle}</p>
        {platform.sublabel && <p className="mt-1 text-xs text-gray-400">{platform.sublabel}</p>}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accentColor">
        Visit <FaExternalLinkAlt size={10} />
      </div>
    </a>
  );
}

/* ─────────────────── Contact Form Component ─────────────────── */

function ContactForm() {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    rating: 0,
    source: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const t = useTranslations("contact");

  useEffect(() => {
    if (!formRef.current) return;
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: formRef.current,
          start: "top 85%",
        },
      }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rating) {
      setToast({ message: t("toast_no_rating"), type: "error" });
      return;
    }
    setStatus("sending");

    const stars = "⭐".repeat(form.rating) + " " + `(${form.rating}/5)`;
    const templateParams = {
      from_name  : form.name,
      from_email : form.email,
      phone      : form.phone || "-",
      purpose    : form.purpose,
      rating     : stars,
      source     : form.source || "-",
      message    : form.message,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setStatus("sent");
      setToast({ message: t("toast_success"), type: "success" });
      setForm({ name: "", email: "", phone: "", purpose: "", rating: 0, source: "", message: "" });
    } catch {
      setStatus("idle");
      setToast({ message: t("toast_error"), type: "error" });
    }
  };

  const inputCls =
    "w-full bg-gray-50 dark:bg-[#1c2426] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accentColor focus:ring-1 focus:ring-accentColor transition-all duration-200";
  const selectExtraCls = "[&>option]:bg-white [&>option]:text-gray-800 dark:[&>option]:bg-[#1c2426] dark:[&>option]:text-white";

  return (
    <>
    <div ref={formRef} className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-8 shadow-xl dark:shadow-none">
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-accentColor/20 flex items-center justify-center">
              <FaPaperPlane className="text-accentColor" size={28} />
            </div>
            <div className="text-2xl font-bold dark:text-white">{t("sent_title")}</div>
            <div className="text-gray-500 dark:text-gray-400 text-center">
              {t("sent_desc")}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("label_fullname")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("label_phone")}{" "}
                <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({t("optional")})</span>
              </label>
              <input
                type="tel"
                placeholder="+62 812 3456 7890"
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("label_purpose")} <span className="text-red-400">*</span>
              </label>
              <select
                required
                className={`${inputCls} ${selectExtraCls} cursor-pointer`}
                value={form.purpose}
                onChange={(e) => set("purpose", e.target.value)}
              >
                <option value="" disabled>{t("select_purpose")}</option>
                <option value="Just Visiting & Giving Feedback">{t("purpose_feedback")}</option>
                <option value="Project Collaboration">{t("purpose_collab")}</option>
                <option value="Freelance / Hire Me">{t("purpose_freelance")}</option>
                <option value="General Question">{t("purpose_question")}</option>
                <option value="Other">{t("purpose_other")}</option>
              </select>
            </div>

            {/* Star rating */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("label_rating")} <span className="text-red-400">*</span>
              </label>
              <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
              {form.rating > 0 && (
                <p className="text-xs text-accentColor font-medium">
                  {[t("rating_1"), t("rating_2"), t("rating_3"), t("rating_4"), t("rating_5")][form.rating - 1]}
                </p>
              )}
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("label_source")}{" "}
                <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({t("optional")})</span>
              </label>
              <select
                className={`${inputCls} ${selectExtraCls} cursor-pointer`}
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              >
                <option value="">{t("select_source")}</option>
                <option value="Google Search">Google Search</option>
                <option value="GitHub">GitHub</option>
                <option value="Email">Email</option>
                <option value="Referral / Friend">{t("source_referral")}</option>
                <option value="Other">{t("source_other")}</option>
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("label_message")} <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder={t("placeholder_message")}
                className={`${inputCls} resize-none`}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-accentColor text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accentColor/25"
            >
              {status === "sending" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{t("btn_sending")}</span>
                </>
              ) : (
                <>
                  <FaPaperPlane size={14} />
                  <span>{t("btn_send")}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
    {toast && (
      <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
    )}
    </>
  );
}

/* ─────────────────── Section Header ─────────────────── */

function SectionHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
        },
      }
    );
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accentColor/10 text-xl">
        {emoji}
      </div>
      <div>
        <h3 className="text-lg font-bold dark:text-white text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-accentColor/30 to-transparent ml-2" />
    </div>
  );
}

/* ─────────────────── Main Page ─────────────────── */

export default function ContactPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("contact");
  const GROUP_TITLE: Record<string, string> = {
    video: t("group_video"),
    instagram: t("group_instagram"),
    professional: t("group_professional"),
    messaging: t("group_messaging"),
    gaming: t("group_gaming"),
    community: t("group_community"),
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(
        ".hero-title",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        ".hero-subtitle",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.25 }
      );
      gsap.fromTo(
        ".hero-badge",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", delay: 0.4 }
      );
      gsap.fromTo(
        ".back-btn",
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0e1517] transition-colors duration-300">
      {/* ── Hero / Header ── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-white dark:bg-[#161D1F] border-b border-gray-100 dark:border-white/5"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accentColor/5 rounded-full blur-3xl" />
          <div className="absolute -top-20 right-0 w-[300px] h-[300px] bg-accentColor/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-[5%] pt-32 pb-20 flex flex-col">
          {/* Badge */}
          <div className="mb-6">
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accentColor/30 bg-accentColor/10 text-accentColor text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accentColor animate-pulse" />
              Open to Collaboration
            </div>
          </div>

          <h1
            className="hero-title text-5xl md:text-6xl lg:text-7xl font-extrabold dark:text-white text-gray-900 leading-tight mb-6"
          >
            Contact <span className="text-accentColor">&</span>
            <br />
            Media
          </h1>
          <p className="hero-subtitle text-gray-500 dark:text-gray-400 text-lg max-w-xl leading-relaxed">
            {t("hero_subtitle")}
          </p>

          {/* Quick stats */}
          <div className="hero-subtitle flex flex-wrap gap-6 mt-8">
            {[
              { label: "联系方式", value: "2" },
              { label: "回复方式", value: "邮箱" },
              { label: "欢迎交流", value: "SLAM" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-bold text-accentColor">{stat.value}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1100px] mx-auto px-6 lg:px-[5%] py-20 flex flex-col gap-24">

        {/* ── Section 1: Contact Form ── */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accentColor/30 bg-accentColor/10 text-accentColor text-xs font-semibold mb-3">
              <SiGmail size={12} /> {t("form_badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold dark:text-white text-gray-900 mb-3">
              {t("form_title")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
              {t("form_desc")}
            </p>
          </div>
          <ContactForm />
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-3 py-1 rounded-full border border-gray-200 dark:border-white/10">
            {t("or_find_me")}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>

        {/* ── Section 2: Contact Links ── */}
        <section>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accentColor/30 bg-accentColor/10 text-accentColor text-xs font-semibold mb-3">
              联系方式
            </div>
            <h2 className="text-3xl md:text-4xl font-bold dark:text-white text-gray-900 mb-3">
              GitHub 与邮箱
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
              {t("social_desc")}
            </p>
          </div>

          <div className="flex flex-col gap-14">
            {socialGroups.map((group) => (
              <div key={group.id}>
                <SectionHeader
                  emoji={group.emoji}
                  title={GROUP_TITLE[group.id] ?? group.title}
                />
                <div
                  className={`grid gap-4 ${
                    group.platforms.length === 1
                      ? "grid-cols-1 max-w-xs"
                      : group.platforms.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : group.platforms.length >= 4
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {group.platforms.map((platform, i) => (
                    <SocialCard
                      key={platform.id}
                      platform={platform}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
              欢迎交流
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              如果你也关注 SLAM、机器人感知或个人站开发，可以随时联系我。
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accentColor text-white text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg shadow-accentColor/20"
            >
              <FaArrowLeft size={12} />
              {t("cta_back")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
