"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { X, Star, GitFork, Globe, Calendar, Tag, Code2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import TranslateWidget from "@/components/TranslateWidget";
import type { GitHubRepo } from "@/types/github";

interface Props {
  repo: GitHubRepo;
  onClose: () => void;
}

type ReadmeState = "loading" | "ok" | "error" | "none";

export default function GitHubRepoDetailModal({ repo, onClose }: Props) {
  const t = useTranslations("projectsPage");
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [readme, setReadme] = useState<string>("");
  const [readmeState, setReadmeState] = useState<ReadmeState>("loading");
  const [translated, setTranslated] = useState<{ description: string } | null>(null);

  const displayDescription = translated?.description ?? (repo.description ?? "");

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

  // ── Fetch README (tries HEAD → main → master) ─────────────────────────────
  useEffect(() => {
    let ignore = false;
    setReadmeState("loading");

    async function tryBranch(branch: string): Promise<string | null> {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${repo.full_name}/${branch}/README.md`
        );
        if (res.ok) return await res.text();
        return null;
      } catch {
        return null;
      }
    }

    async function fetchReadme() {
      for (const branch of ["HEAD", "main", "master"]) {
        const content = await tryBranch(branch);
        if (content !== null) {
          if (!ignore) {
            setReadme(content);
            setReadmeState("ok");
          }
          return;
        }
      }
      if (!ignore) setReadmeState("none");
    }

    fetchReadme().catch(() => {
      if (!ignore) setReadmeState("error");
    });

    return () => {
      ignore = true;
    };
  }, [repo.full_name]);

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

  const updated = new Date(repo.updated_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
        className="modal-scroll relative bg-white dark:bg-[#141c1f] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
      >
        {/* ── Sticky header ─────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-[#141c1f] border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <FaGithub size={16} className="text-gray-500 dark:text-white/50 shrink-0" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {repo.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {repo.description && (
              <TranslateWidget
                fields={{ description: repo.description }}
                onTranslated={(out) =>
                  setTranslated({ description: out.description })
                }
                onReverted={() => setTranslated(null)}
                size="sm"
              />
            )}
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
          {/* Description */}
          {displayDescription && (
            <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
              {displayDescription}
            </p>
          )}

          {/* Stats grid */}
          <div className="flex flex-wrap gap-4">
            {repo.language && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
                <Code2 size={13} className="text-[#0acf83]" />
                <span>{repo.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
              <Star size={13} className="text-yellow-400" />
              <span>
                {repo.stargazers_count} {t("detail_stars")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
              <GitFork size={13} className="text-blue-400" />
              <span>
                {repo.forks_count} {t("detail_forks")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
              <Calendar size={13} className="text-purple-400" />
              <span>
                {t("detail_updated")}: {updated}
              </span>
            </div>
          </div>

          {/* Topics */}
          {repo.topics.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-white/60 mb-2">
                <Tag size={13} />
                {t("detail_topics")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0acf83]/10 text-[#0acf83] border border-[#0acf83]/20"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {repo.visibility !== "private" && (
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white/10 text-white text-xs font-medium hover:opacity-90 transition shadow-md"
              >
                <FaGithub size={13} />
                {t("detail_github_link")}
              </a>
            )}
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0acf83] text-white text-xs font-medium hover:opacity-90 transition shadow-md"
              >
                <Globe size={13} />
                {t("detail_demo")}
              </a>
            )}
          </div>

          {/* README section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">
              <span className="font-mono text-[#0acf83] text-base">##</span>
              {t("detail_readme")}
            </div>

            {readmeState === "loading" && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-white/30">
                <div className="w-4 h-4 border-2 border-[#0acf83]/30 border-t-[#0acf83] rounded-full animate-spin" />
                {t("detail_readme_loading")}
              </div>
            )}

            {readmeState === "none" && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-white/30 italic">
                {t("detail_readme_none")}
              </p>
            )}

            {readmeState === "error" && (
              <p className="py-8 text-center text-sm text-red-400 italic">
                {t("detail_readme_error")}
              </p>
            )}

            {readmeState === "ok" && (
              <div className="prose prose-sm dark:prose-invert max-w-none github-readme overflow-x-auto break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readme}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
