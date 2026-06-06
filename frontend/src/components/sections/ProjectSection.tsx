"use client";

import { useEffect, useRef, useState } from "react";
import useOnScreen from "@/hooks/UseOnScreen";
import useScrollActive from "@/hooks/UseScrollActive";
import { useSectionStore } from "@/stores/Section";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StaticImageData } from "next/image";
import Link from "next/link";
import { RoughNotation } from "react-rough-notation";
import ProjectCard from "../ProjectCard";
import { useTranslations } from "next-intl";
import { fetchPopularProjects } from "@/lib/projectsApi";

// ─── Skeleton card shown while Supabase data is loading ──────────────────────
function ProjectCardSkeleton() {
  return (
    <div className="relative col-span-1 w-full flex flex-col shadow-shadow0 border rounded-2xl overflow-hidden bg-white animate-pulse">
      <div className="w-full aspect-video bg-gray-200" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-3/4 rounded bg-gray-200" />
        <div className="h-2.5 w-full rounded bg-gray-100" />
        <div className="h-2.5 w-2/3 rounded bg-gray-100" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 w-14 rounded-full bg-gray-200" />
          <div className="h-4 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="px-4 pb-4 flex justify-between">
        <div className="h-3 w-8 rounded bg-gray-200" />
        <div className="h-6 w-16 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

export default function ProjectSection() {
  gsap.registerPlugin(ScrollTrigger);
  const t = useTranslations("projects");

  const sectionRef = useRef<HTMLElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(elementRef as React.RefObject<HTMLElement>);

  // ─── Supabase data state ────────────────────────────────────────────────────
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch popular projects from Supabase ─────────────────────────────────
  useEffect(() => {
    fetchPopularProjects().then((rows) => {
      setDisplayProjects((rows || []) as Project[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = gsap.utils.selector(sectionRef);
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        scrub: true,
        onEnter: () => {
          gsap.fromTo(
            q(".qoutes-animation"),
            {
              y: "-200%",
            },
            {
              y: 0,
            }
          );
        },
      },
    });
    return () => {
      timeline.kill();
    };
  }, []);
  const projectSectionOnView = useScrollActive(
    sectionRef as React.RefObject<HTMLElement>
  );
  const { setSection } = useSectionStore();

  useEffect(() => {
    if (projectSectionOnView) {
      setSection("#project");
    }
  }, [projectSectionOnView, setSection]);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="relative h-full bg-gray-50 overflow-hidden py-14 px-10 lg:px-[5%]"
    >
      <div className="w-full max-w-[1100px] h-full m-auto flex flex-col items-center gap-14">
        <div className="w-[80%] md:w-full flex absolute left-1/2 -translate-x-1/2 flex-col gap-8 items-center">
          <RoughNotation
            type="underline"
            strokeWidth={2}
            color="hsl(157, 87%, 41%)"
            order={1}
            show={isOnScreen}
          >
            <div className="text-xl md:text-4xl tracking-tight font-medium w-fit text-black">
              {t("title")}
            </div>
          </RoughNotation>
          <div ref={elementRef} className="overflow-hidden ">
            <div className="qoutes-animation md:w-full text-center font-medium flex flex-col items-center text-black">
              <div>{t("quote_line1")}</div>
              <div>{t("quote_line2")}</div>
            </div>
          </div>
        </div>
        <div className="w-full pt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            : displayProjects.length > 0 ? (
              displayProjects.map((project) => (
                <ProjectCard key={project.id} item={project} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-gray-500 dark:text-gray-400 py-10">Belum ada project yang ditampilkan.</div>
            )}
        </div>

        <div className="font-medium text-black">
          {t("see_more")}{" "}
          <Link
            href="https://github.com/agungkurniawanid"
            target="_blank"
            aria-label="Expore more in my github profile"
            rel="noopener noreferrer"
            className="text-accentColor navlink hover:text-accentColor"
          >
            my github profile
          </Link>
        </div>
      </div>
    </section>
  );
}

export interface Project {
  id: number | string;
  title: string;
  description: string;
  platformApp: string[];
  /** Accepts a Next.js StaticImageData import OR a Supabase CDN URL string. */
  image: StaticImageData | string;
  githubURL: {
    [key: string]: string;
  };
  githubApi: string;
  liveURL: string;
  technologies: string[];
}
