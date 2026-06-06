"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Image from "next/image";
import { Code2, FileCode, MonitorSmartphone, X, Star, GitFork, Calendar, Tag } from "lucide-react";
import { FaGithub as Github } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTechIcon } from "./TechIcon";
import { Project } from "./sections/ProjectSection";
import TranslateWidget from "@/components/TranslateWidget";

interface GitHubStats {
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
}

type ReadmeState = "idle" | "loading" | "ok" | "error" | "none";

interface Props {
  item: Project;
  onClose: () => void;
}

export default function ProjectDetailModal({ item, onClose }: Props) {
  const t = useTranslations("projectsPage");
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [translated, setTranslated] = useState<{ title: string; description: string; readme?: string } | null>(null);
  const [ghStats, setGhStats] = useState<GitHubStats | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [readmeState, setReadmeState] = useState<ReadmeState>("idle");

  const displayTitle       = translated?.title       ?? item.title;
  const displayDescription = translated?.description ?? item.description;
  const displayReadme      = translated?.readme      ?? readme;

  // ── Fetch GitHub stats if githubApi is set ────────────────────────────────
  useEffect(() => {
    if (!item.githubApi) return;
    let ignore = false;
    fetch(item.githubApi)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) {
          setGhStats({
            language: data.language ?? null,
            stargazers_count: data.stargazers_count ?? 0,
            forks_count: data.forks_count ?? 0,
            topics: data.topics ?? [],
            updated_at: data.updated_at ?? "",
          });
        }
      })
      .catch(() => {/* ignore errors */});
    return () => { ignore = true; };
  }, [item.githubApi]);

  // ── Fetch README if githubApi is set ─────────────────────────────────────
  useEffect(() => {
    if (!item.githubApi) return;
    let ignore = false;
    // Extract full_name from API URL: https://api.github.com/repos/{owner}/{repo}
    const match = item.githubApi.match(/api\.github\.com\/repos\/([^/]+\/[^/]+)/);
    if (!match) return;
    const fullName = match[1];
    setReadmeState("loading");

    async function tryBranch(branch: string): Promise<string | null> {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${fullName}/${branch}/README.md`
        );
        if (res.ok) return await res.text();
        return null;
      } catch { return null; }
    }

    async function fetchReadme() {
      for (const branch of ["HEAD", "main", "master"]) {
        const content = await tryBranch(branch);
        if (content !== null) {
          if (!ignore) { setReadme(content); setReadmeState("ok"); }
          return;
        }
      }
      if (!ignore) setReadmeState("none");
    }
    fetchReadme().catch(() => { if (!ignore) setReadmeState("error"); });
    return () => { ignore = true; };
  }, [item.githubApi]);

  // Open animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }
      );
    });
    return () => ctx.revert();
  }, []);

  // Close animation then call onClose
  const handleClose = () => {
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.85,
      y: 30,
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

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) handleClose();
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        ref={contentRef}
        className="modal-scroll relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header image */}
        <div className="relative w-full aspect-video">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover rounded-t-2xl"
            priority
          />
          <button
            onClick={handleClose}
            aria-label={t("detail_close")}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-1.5 transition shadow-md"
          >
            <X size={18} className="text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Title + Translate */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-accentColor font-semibold text-lg leading-snug">
              {displayTitle}
            </h2>
            <TranslateWidget
              fields={
                readmeState === "ok"
                  ? { title: item.title, description: item.description, readme }
                  : { title: item.title, description: item.description }
              }
              onTranslated={(out) =>
                setTranslated({ title: out.title, description: out.description, readme: out.readme })
              }
              onReverted={() => setTranslated(null)}
              size="md"
              className="shrink-0 mt-0.5"
            />
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 leading-relaxed">
            {displayDescription}
          </p>

          {/* GitHub stats (shown when githubApi is set) */}
          {ghStats && (
            <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {ghStats.language && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Code2 size={12} className="text-accentColor" />
                  <span>{ghStats.language}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Star size={12} className="text-yellow-400" />
                <span>{ghStats.stargazers_count} {t("detail_stars")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <GitFork size={12} className="text-blue-400" />
                <span>{ghStats.forks_count} {t("detail_forks")}</span>
              </div>
              {ghStats.updated_at && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} className="text-purple-400" />
                  <span>
                    {t("detail_updated")}:{" "}
                    {new Date(ghStats.updated_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              )}
              {ghStats.topics.length > 0 && (
                <div className="w-full flex flex-wrap gap-1 mt-1">
                  <Tag size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  {ghStats.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accentColor/10 text-accentColor border border-accentColor/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Platform */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <MonitorSmartphone size={15} />
              <span>{t("detail_platform")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.platformApp.map((p, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium shadow-sm ${
                    i % 2 === 0
                      ? "border border-accentColor text-black bg-white"
                      : "bg-accentColor text-white"
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <Code2 size={15} />
              <span>{t("detail_tech")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.technologies.map((tech, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1 shadow-md bg-[#f1f1f1] rounded-xl text-xs flex items-center gap-1"
                >
                  {getTechIcon(tech)}
                  <span className="text-black">{tech}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <FileCode size={15} />
              <span>{t("detail_links")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={item.liveURL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 flex items-center gap-2 bg-accentColor text-white rounded-md text-xs font-medium shadow-md hover:opacity-90 transition"
              >
                <FaYoutube size={15} />
                <span>{t("detail_demo")}</span>
              </a>
              {item.githubURL &&
                Object.entries(item.githubURL).map(([key, url], i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 flex items-center gap-2 bg-black text-white rounded-md text-xs font-medium shadow-md hover:opacity-90 transition"
                  >
                    <Github size={15} />
                    <span>
                      {t("detail_github_link")} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  </a>
                ))}
            </div>
          </div>

          {/* README section */}
          {item.githubApi && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-black mb-3 pb-2 border-t border-gray-100 pt-2">
                <span className="font-mono text-accentColor text-base">##</span>
                {t("detail_readme")}
              </div>

              {readmeState === "loading" && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-accentColor/30 border-t-accentColor rounded-full animate-spin" />
                  {t("detail_readme_loading")}
                </div>
              )}

              {readmeState === "none" && (
                <p className="py-6 text-center text-sm text-gray-400 italic">
                  {t("detail_readme_none")}
                </p>
              )}

              {readmeState === "error" && (
                <p className="py-6 text-center text-sm text-red-400 italic">
                  {t("detail_readme_error")}
                </p>
              )}

              {readmeState === "ok" && (
                <div className="prose prose-sm max-w-none github-readme overflow-x-auto break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {displayReadme}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
