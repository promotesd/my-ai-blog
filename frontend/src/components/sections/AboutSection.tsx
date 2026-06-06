"use client";

import { useCallback, useEffect, useRef } from "react";
import useScrollActive from "@/hooks/UseScrollActive";
import Circle from "@/assets/about/circle.svg";
import Signs from "@/assets/about/signs.svg";
import Star from "@/assets/about/star.svg";
import Triangle from "@/assets/about/triangle.svg";
import ShinThantImage from "@/assets/IMG_20221112_005922.jpg";
import { useSectionStore } from "@/stores/Section";
import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import Image from "next/image";
import SplitType from "split-type";
import { useTranslations } from "next-intl";
import { useLanguageStore } from "@/stores/LanguageStore";
import { fetchAboutStats, type AboutStats } from "@/lib/projectsApi";


export default function AboutSection() {
  gsap.registerPlugin(ScrollTrigger);
  const t = useTranslations("about");
  const { locale } = useLanguageStore();

  // Menginisialisasi sectionRef dengan tipe HTMLElement dan memberi tahu TypeScript bahwa ini tidak akan null
  const sectionRef = useRef<HTMLElement>(null!);

  /**
   * Mutable ref so GSAP's onEnter closure always reads the latest fetched values
   * without needing to re-register the ScrollTrigger.
   */
  const statsRef = useRef<AboutStats>({ yearsExperience: 0, contributions: 0, totalProjects: 0, totalSkills: 0, totalCertificates: 0 });

  /** True once the ScrollTrigger onEnter has fired at least once */
  const hasEnteredRef = useRef(false);

  /** Ref to the counter ScrollTrigger so it can be properly killed on cleanup */
  const counterSTRef = useRef<ReturnType<typeof ScrollTrigger.create> | null>(null);

  /** Animate the three counters to the given stats values */
  const animateCounters = useCallback((s: AboutStats) => {
    const q = gsap.utils.selector(sectionRef);
    gsap.to(q(".experience-count"), {
      innerText: s.yearsExperience,
      duration: 0.5,
      snap: { innerText: 1 },
      overwrite: true,
    });
    gsap.to(q(".project-count"), {
      innerText: s.totalProjects,
      duration: 0.5,
      snap: { innerText: 1 },
      overwrite: true,
    });
    gsap.to(q(".user-count"), {
      innerText: s.contributions,
      duration: 0.5,
      snap: { innerText: 1 },
      overwrite: true,
    });
  }, []);

  // Fetch stats from Supabase + GitHub API once on mount
  useEffect(() => {
    fetchAboutStats()
      .then((data) => {
        statsRef.current = data;
        // If onEnter already fired → re-animate to real values immediately
        if (hasEnteredRef.current) {
          animateCounters(data);
        }
      })
      .catch((err) => {
        console.error("[AboutSection] fetchAboutStats failed:", err);
      });
  }, [animateCounters]);

  useEffect(() => {
    const q = gsap.utils.selector(sectionRef);

    // Re-split title text whenever locale changes
    const splitInstances = q(".title").map((el: HTMLElement) => {
      return new SplitType(el, {
        types: "chars",
        tagName: "span",
      });
    });

    const titleTrigger = gsap.from(q(".title .char"), {
      opacity: 0.3,
      duration: 0.5,
      ease: "power1.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: q(".title"),
        start: "top center",
        scrub: true,
      },
    });

    counterSTRef.current = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        hasEnteredRef.current = true;

        const tl = gsap.timeline({
          defaults: {
            stagger: 0.2,
            duration: 0.3,
          },
        });

        tl.fromTo(q(".image-animation"), { x: 200 }, { x: 0 });
        tl.fromTo(q(".text-animation"), { y: 100 }, { y: 0 });

        // Read the latest fetched values from the ref at animation time
        const s = statsRef.current;

        tl.to(q(".experience-count"), {
          innerText: s.yearsExperience,
          duration: 0.5,
          snap: { innerText: 1 },
          overwrite: true,
        });

        tl.to(
          q(".project-count"),
          {
            innerText: s.totalProjects,
            duration: 0.5,
            snap: { innerText: 1 },
            overwrite: true,
          },
          "-=0.3"
        );

        tl.to(
          q(".user-count"),
          {
            innerText: s.contributions,
            duration: 0.5,
            snap: { innerText: 1 },
            overwrite: true,
          },
          "-=0.3"
        );
      },
    });

    return () => {
      titleTrigger.scrollTrigger?.kill();
      counterSTRef.current?.kill();
      counterSTRef.current = null;
      hasEnteredRef.current = false;
      splitInstances.forEach((instance: SplitType) => instance.revert());
    };
  }, [locale]);

  // Set Active Session
  const aboutSectionOnView = useScrollActive(sectionRef);
  const { setSection } = useSectionStore();

  useEffect(() => {
    if (aboutSectionOnView) {
      setSection("#about");
    } else {
      setSection("#home");
    }
  }, [aboutSectionOnView, setSection]);

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="relative h-full bg-gray-100 dark:bg-[#161D1F] overflow-hidden py-14 px-10 lg:px-[5%]"
    >
      <div className="w-full max-w-[1100px] h-full m-auto flex flex-col items-center gap-24">
        <div key={locale} className="relative title text-xl md:text-4xl tracking-tight font-medium w-fit dark:text-white">
          {t("quote")}
          <div className="absolute -right-[10px] top-2">
            <Image
              className="w-14 pointer-events-none select-none"
              src={Signs}
              alt="signs"
            />
          </div>
        </div>
        <div className="w-full flex flex-col-reverse md:flex-row items-center gap-20 md:gap-2 lg:gap-10">
          <div className="w-full flex flex-col items-start gap-7 md:gap-9">
            <div className="relative">
              <div className="overflow-hidden">
                <div className="text-animation dark:text-accentColor text-3xl md:text-4xl font-medium">
                  {t("title")}
                </div>
              </div>

              <div className="absolute -top-6 -left-8">
                <svg
                  width="45"
                  height="37"
                  viewBox="0 0 45 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M25.807 19.086c-.485-.764-.744-1.319-1.136-1.76a815.404 815.404 0 00-7.627-8.56 4.462 4.462 0 00-1.429-1.06c-.352-.16-1.016-.182-1.22.033-.3.32-.508.962-.396 1.37.165.624.57 1.226.99 1.737 2.52 3.07 5.081 6.113 7.626 9.161.143.17.302.337.475.48.6.508 1.352.985 1.995.37.447-.429.524-1.245.722-1.771zM36.215 9.964c.25 1.018.476 2.041.759 3.053.232.816.832 1.255 1.674 1.21.847-.046 1.371-.582 1.568-1.378.105-.425.176-.914.07-1.328-.645-2.533-1.341-5.05-2.03-7.57-.056-.212-.147-.491-.309-.587-.54-.323-1.14-.827-1.688-.8-.86.045-1.203.871-1.13 1.67.104 1.114.322 2.221.534 3.322.155.806.384 1.601.577 2.404l-.027.009.002-.005zM7.28 28.081c-.22.298-.737.71-.825 1.2-.072.394.287.96.603 1.313.28.309.746.487 1.164.633 1.967.697 3.947 1.363 5.921 2.04.21.071.43.13.65.167.981.166 1.984.278 2.601-.72.457-.732-.07-1.93-1.239-2.553-2.395-1.274-4.98-1.97-7.69-2.171-.295-.021-.595.046-1.183.095l-.001-.004z"
                    fill="#ffffff"
                  ></path>
                </svg>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <div className="overflow-hidden">
                <div className="dark:text-white text-animation">
                  {t("paragraph1")}
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="dark:text-white text-animation">
                  {t("edu_label")}
                </div>
              </div>
              <div className="flex gap-1 flex-col items-start">
                <div className="text-accentColor">
                  {t("edu_school")}
                </div>
                <div className="overflow-hidden">
                  <div className="dark:text-white text-animation">
                    {t("edu_desc")}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full border-t-accentColor py-5 border-b-accentColor border-t-[0.01px] border-b-[0.01px] flex items-center gap-6 md:gap-6 lg:gap-20">
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-medium dark:text-white">
                  <span className="experience-count">0</span>{" "}
                  <span className="text-accentColor">+</span>
                </div>
                <div className="dark:text-white text-sm">{t("experience_label")}</div>
              </div>

              <div className="flex flex-col font-medium items-center">
                <div className="text-3xl md:text-4xl dark:text-white">
                  <span className="project-count">0</span>{" "}
                  <span className="text-accentColor">+</span>
                </div>
                <div className="dark:text-white text-sm">
                  {t("projects_label")}
                </div>
              </div>

              <div className="flex flex-col font-medium items-center">
                <div className="text-3xl md:text-4xl dark:text-white">
                  <span className="user-count">0</span>{" "}
                  <span className="text-accentColor">+</span>
                </div>
                <div className="dark:text-white text-sm">{t("clients_label")}</div>
              </div>
            </div>
          </div>
          <div className="w-full h-full flex justify-center items-center image-animation ">
            <div className="relative w-[180px] h-[170px] lg:w-[300px] lg:h-[290px]">
              <div className="w-full h-full bg-accentColor shadow-md rounded-sm absolute -right-3 -bottom-3" />
              <Image
                className="absolute z-10 object-contain  w-full h-full shadow-sm rounded-sm"
                width={300}
                height={300}
                priority
                alt="shin thant's profile"
                src={ShinThantImage}
              />

              <div className="absolute hidden lg:block -top-12 -right-12">
                <Image
                  className="pointer-events-auto select-none"
                  width={26}
                  height={26}
                  alt="triangle background"
                  src={Triangle}
                />
              </div>

              <div className="absolute hidden lg:block -bottom-14 -right-10">
                <Image
                  className="pointer-events-auto select-none"
                  width={22}
                  height={22}
                  alt="circle background"
                  src={Circle}
                />
              </div>

              <div className="absolute hidden lg:block -bottom-16 -left-10">
                <Image
                  className="pointer-events-auto select-none"
                  width={34}
                  height={34}
                  alt="star background"
                  src={Star}
                />
              </div>
            </div>
          </div>
        </div>

        <TechStack />
      </div>
    </section>
  );
}

const TechStack = () => {
  return (
    <div className="w-full inline-flex gap-20 flex-nowrap lg:overflow-hidden">
      <div className="flex items-center gap-20 justify-center animate-infinite-scroll">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M15 17.5c.32 .32 .754 .5 1.207 .5h.543c.69 0 1.25 -.56 1.25 -1.25v-.25a1.5 1.5 0 0 0 -1.5 -1.5a1.5 1.5 0 0 1 -1.5 -1.5v-.25c0 -.69 .56 -1.25 1.25 -1.25h.543c.453 0 .887 .18 1.207 .5" />
            <path d="M9 12h4" />
            <path d="M11 12v6" />
            <path d="M21 19v-14a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2z" />
          </svg>
          <div className="dark:text-white text-lg font-medium">TypeScript</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6.306 8.711c-2.602 .723 -4.306 1.926 -4.306 3.289c0 2.21 4.477 4 10 4c.773 0 1.526 -.035 2.248 -.102" />
            <path d="M17.692 15.289c2.603 -.722 4.308 -1.926 4.308 -3.289c0 -2.21 -4.477 -4 -10 -4c-.773 0 -1.526 .035 -2.25 .102" />
            <path d="M6.305 15.287c-.676 2.615 -.485 4.693 .695 5.373c1.913 1.105 5.703 -1.877 8.464 -6.66c.387 -.67 .733 -1.339 1.036 -2" />
            <path d="M17.694 8.716c.677 -2.616 .487 -4.696 -.694 -5.376c-1.913 -1.105 -5.703 1.877 -8.464 6.66c-.387 .67 -.733 1.34 -1.037 2" />
            <path d="M12 5.424c-1.925 -1.892 -3.82 -2.766 -5 -2.084c-1.913 1.104 -1.226 5.877 1.536 10.66c.386 .67 .793 1.304 1.212 1.896" />
            <path d="M12 18.574c1.926 1.893 3.821 2.768 5 2.086c1.913 -1.104 1.226 -5.877 -1.536 -10.66c-.375 -.65 -.78 -1.283 -1.212 -1.897" />
            <path d="M11.5 12.866a1 1 0 1 0 1 -1.732a1 1 0 0 0 -1 1.732z" />
          </svg>
          <div className="dark:text-white text-lg font-medium">React</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993" />
            <path d="M15 12v-3" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Next</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M20 4l-2 14.5l-6 2l-6 -2l-2 -14.5z" />
            <path d="M7.5 8h3v8l-2 -1" />
            <path d="M16.5 8h-2.5a.5 .5 0 0 0 -.5 .5v3a.5 .5 0 0 0 .5 .5h1.423a.5 .5 0 0 1 .495 .57l-.418 2.93l-2 .5" />
          </svg>
          <div className="dark:text-white text-lg font-medium">JavaScript</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11.667 6c-2.49 0 -4.044 1.222 -4.667 3.667c.933 -1.223 2.023 -1.68 3.267 -1.375c.71 .174 1.217 .68 1.778 1.24c.916 .912 2 1.968 4.288 1.968c2.49 0 4.044 -1.222 4.667 -3.667c-.933 1.223 -2.023 1.68 -3.267 1.375c-.71 -.174 -1.217 -.68 -1.778 -1.24c-.916 -.912 -1.975 -1.968 -4.288 -1.968zm-4 6.5c-2.49 0 -4.044 1.222 -4.667 3.667c.933 -1.223 2.023 -1.68 3.267 -1.375c.71 .174 1.217 .68 1.778 1.24c.916 .912 1.975 1.968 4.288 1.968c2.49 0 4.044 -1.222 4.667 -3.667c-.933 1.223 -2.023 1.68 -3.267 1.375c-.71 -.174 -1.217 -.68 -1.778 -1.24c-.916 -.912 -1.975 -1.968 -4.288 -1.968z" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Tailwind</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5.308 7.265l5.385 -3.029" />
            <path d="M13.308 4.235l5.384 3.03" />
            <path d="M20 9.5v5" />
            <path d="M18.693 16.736l-5.385 3.029" />
            <path d="M10.692 19.765l-5.384 -3.03" />
            <path d="M4 14.5v-5" />
            <path d="M12.772 4.786l6.121 10.202" />
            <path d="M18.5 16h-13" />
            <path d="M5.107 14.988l6.122 -10.201" />
            <path d="M12 3.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M12 20.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M4 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M4 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M20 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M20 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
          </svg>
          <div className="dark:text-white text-lg font-medium">GraphQL</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4.53 17.05l6.15 -11.72h-.02c.38 -.74 1.28 -1.02 2.01 -.63c.26 .14 .48 .36 .62 .62l1.06 2.01" />
            <path d="M15.47 6.45c.58 -.59 1.53 -.59 2.11 -.01c.22 .22 .36 .5 .41 .81l1.5 9.11c.1 .62 -.2 1.24 -.76 1.54l-6.07 2.9c-.46 .25 -1.01 .26 -1.46 0l-6.02 -2.92c-.55 -.31 -.85 -.92 -.75 -1.54l1.96 -12.04c.12 -.82 .89 -1.38 1.7 -1.25c.46 .07 .87 .36 1.09 .77l1.24 1.76" />
            <path d="M4.57 17.18l10.93 -10.68" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Firebase</div>
        </div>
      </div>

      <div
        className="flex items-center gap-20 justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M15 17.5c.32 .32 .754 .5 1.207 .5h.543c.69 0 1.25 -.56 1.25 -1.25v-.25a1.5 1.5 0 0 0 -1.5 -1.5a1.5 1.5 0 0 1 -1.5 -1.5v-.25c0 -.69 .56 -1.25 1.25 -1.25h.543c.453 0 .887 .18 1.207 .5" />
            <path d="M9 12h4" />
            <path d="M11 12v6" />
            <path d="M21 19v-14a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2z" />
          </svg>
          j<div className="dark:text-white text-lg font-medium">TypeScript</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6.306 8.711c-2.602 .723 -4.306 1.926 -4.306 3.289c0 2.21 4.477 4 10 4c.773 0 1.526 -.035 2.248 -.102" />
            <path d="M17.692 15.289c2.603 -.722 4.308 -1.926 4.308 -3.289c0 -2.21 -4.477 -4 -10 -4c-.773 0 -1.526 .035 -2.25 .102" />
            <path d="M6.305 15.287c-.676 2.615 -.485 4.693 .695 5.373c1.913 1.105 5.703 -1.877 8.464 -6.66c.387 -.67 .733 -1.339 1.036 -2" />
            <path d="M17.694 8.716c.677 -2.616 .487 -4.696 -.694 -5.376c-1.913 -1.105 -5.703 1.877 -8.464 6.66c-.387 .67 -.733 1.34 -1.037 2" />
            <path d="M12 5.424c-1.925 -1.892 -3.82 -2.766 -5 -2.084c-1.913 1.104 -1.226 5.877 1.536 10.66c.386 .67 .793 1.304 1.212 1.896" />
            <path d="M12 18.574c1.926 1.893 3.821 2.768 5 2.086c1.913 -1.104 1.226 -5.877 -1.536 -10.66c-.375 -.65 -.78 -1.283 -1.212 -1.897" />
            <path d="M11.5 12.866a1 1 0 1 0 1 -1.732a1 1 0 0 0 -1 1.732z" />
          </svg>
          <div className="dark:text-white text-lg font-medium">React</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993" />
            <path d="M15 12v-3" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Next</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M20 4l-2 14.5l-6 2l-6 -2l-2 -14.5z" />
            <path d="M7.5 8h3v8l-2 -1" />
            <path d="M16.5 8h-2.5a.5 .5 0 0 0 -.5 .5v3a.5 .5 0 0 0 .5 .5h1.423a.5 .5 0 0 1 .495 .57l-.418 2.93l-2 .5" />
          </svg>
          <div className="dark:text-white text-lg font-medium">JavaScript</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11.667 6c-2.49 0 -4.044 1.222 -4.667 3.667c.933 -1.223 2.023 -1.68 3.267 -1.375c.71 .174 1.217 .68 1.778 1.24c.916 .912 2 1.968 4.288 1.968c2.49 0 4.044 -1.222 4.667 -3.667c-.933 1.223 -2.023 1.68 -3.267 1.375c-.71 -.174 -1.217 -.68 -1.778 -1.24c-.916 -.912 -1.975 -1.968 -4.288 -1.968zm-4 6.5c-2.49 0 -4.044 1.222 -4.667 3.667c.933 -1.223 2.023 -1.68 3.267 -1.375c.71 .174 1.217 .68 1.778 1.24c.916 .912 1.975 1.968 4.288 1.968c2.49 0 4.044 -1.222 4.667 -3.667c-.933 1.223 -2.023 1.68 -3.267 1.375c-.71 -.174 -1.217 -.68 -1.778 -1.24c-.916 -.912 -1.975 -1.968 -4.288 -1.968z" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Tailwind</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5.308 7.265l5.385 -3.029" />
            <path d="M13.308 4.235l5.384 3.03" />
            <path d="M20 9.5v5" />
            <path d="M18.693 16.736l-5.385 3.029" />
            <path d="M10.692 19.765l-5.384 -3.03" />
            <path d="M4 14.5v-5" />
            <path d="M12.772 4.786l6.121 10.202" />
            <path d="M18.5 16h-13" />
            <path d="M5.107 14.988l6.122 -10.201" />
            <path d="M12 3.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M12 20.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M4 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M4 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M20 16m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
            <path d="M20 8m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
          </svg>
          <div className="dark:text-white text-lg font-medium">GrapQL</div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="stroke-black dark:stroke-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4.53 17.05l6.15 -11.72h-.02c.38 -.74 1.28 -1.02 2.01 -.63c.26 .14 .48 .36 .62 .62l1.06 2.01" />
            <path d="M15.47 6.45c.58 -.59 1.53 -.59 2.11 -.01c.22 .22 .36 .5 .41 .81l1.5 9.11c.1 .62 -.2 1.24 -.76 1.54l-6.07 2.9c-.46 .25 -1.01 .26 -1.46 0l-6.02 -2.92c-.55 -.31 -.85 -.92 -.75 -1.54l1.96 -12.04c.12 -.82 .89 -1.38 1.7 -1.25c.46 .07 .87 .36 1.09 .77l1.24 1.76" />
            <path d="M4.57 17.18l10.93 -10.68" />
          </svg>
          <div className="dark:text-white text-lg font-medium">Firebase</div>
        </div>
      </div>
    </div>
  );
};
