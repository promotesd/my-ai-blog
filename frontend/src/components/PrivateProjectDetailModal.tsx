"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import {
  X,
  Code2,
  MonitorSmartphone,
  Globe,
  Lock,
  Briefcase,
  Calendar,
} from "lucide-react";
import TranslateWidget from "@/components/TranslateWidget";
import { getTechIcon } from "@/components/TechIcon";

/**
 * Minimal project shape accepted by this modal.
 * Compatible with ManualProject interface in projects/page.tsx.
 */
export interface PrivateProjectData {
  id: string;
  title: string;
  description: string;
  tech: string[];
  category: "company" | "freelance";
  type: string;
  year: string;
  confidential?: boolean;
  liveUrl?: string;
}

interface Props {
  project: PrivateProjectData;
  onClose: () => void;
}

export default function PrivateProjectDetailModal({ project, onClose }: Props) {
  const t = useTranslations("projectsPage");
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [translated, setTranslated] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const displayTitle = translated?.title ?? project.title;
  const displayDescription = translated?.description ?? project.description;

  // ── GSAP open animation ────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.88, y: 28 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }
      );
    });
    return () => ctx.revert();
  }, []);

  // ── Close handlers ─────────────────────────────────────────────────────────
  const handleClose = () => {
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.88,
      y: 28,
      duration: 0.25,
      ease: "power2.in",
    });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCompany = project.category === "company";

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        ref={contentRef}
        className="modal-scroll relative bg-white dark:bg-[#141c1f] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* ── Sticky header ─────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-[#141c1f] border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            {isCompany ? (
              <Lock size={15} className="text-red-400 shrink-0" />
            ) : (
              <Briefcase size={15} className="text-yellow-400 shrink-0" />
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {displayTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TranslateWidget
              fields={{ title: project.title, description: project.description }}
              onTranslated={(out) =>
                setTranslated({
                  title: out.title,
                  description: out.description,
                })
              }
              onReverted={() => setTranslated(null)}
              size="sm"
            />
            <button
              onClick={handleClose}
              aria-label={t("detail_close")}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              <X size={18} className="text-gray-500 dark:text-white/50" />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5">
          {/* Category + Year badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isCompany
                  ? "bg-red-50 dark:bg-red-900/20 text-red-400"
                  : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500"
              }`}
            >
              {isCompany ? (
                <>
                  <Lock size={10} />
                  {t("badge_confidential")}
                </>
              ) : (
                <>
                  <Briefcase size={10} />
                  {t("badge_freelance")}
                </>
              )}
            </span>
            {project.year && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50">
                <Calendar size={10} />
                {project.year}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
            {displayDescription}
          </p>

          {/* Confidential note */}
          {project.confidential && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
              <Lock size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">
                {t("detail_confidential_note")}
              </p>
            </div>
          )}

          {/* Platform / Type */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-white/60 mb-2">
              <MonitorSmartphone size={13} />
              {t("detail_platform")}
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-medium border border-[#0acf83]/40 text-[#0acf83] bg-[#0acf83]/5">
              {project.type}
            </span>
          </div>

          {/* Tech Stack */}
          {project.tech.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-white/60 mb-2">
                <Code2 size={13} />
                {t("detail_tech")}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1 shadow-sm bg-[#f1f1f1] dark:bg-white/10 rounded-xl text-xs flex items-center gap-1"
                  >
                    {getTechIcon(tech)}
                    <span className="text-gray-700 dark:text-white/80">
                      {tech}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live URL */}
          {project.liveUrl && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-white/60 mb-2">
                <Globe size={13} />
                {t("detail_links")}
              </div>
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0acf83] text-white text-xs font-medium hover:opacity-90 transition shadow-md"
              >
                <Globe size={13} />
                {t("detail_demo")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
