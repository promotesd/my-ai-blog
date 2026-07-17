import { useEffect, useRef } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PROFILE } from "@/config/profile";

export default function HeroContent() {
  const sectionRef = useRef(null);
  const q = gsap.utils.selector(sectionRef);
  const t = useTranslations("hero");
  const bio = t("bio");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const textAnimationTimeline = gsap.timeline({
      defaults: { stagger: 0.12, duration: 0.4 },
    });

    textAnimationTimeline.fromTo(
      q(".text-animation"),
      {
        y: 100,
      },
      {
        y: 0,
        delay: 0.2,
      }
    );
    textAnimationTimeline.fromTo(
      ".bio-animation ",
      {
        scale: 0,
      },
      {
        scale: 1,
        ease: "back",
        duration: 0.35,
      }
    );
  }, [q]);

  return (
    <div
      ref={sectionRef}
      className="absolute max-w-[55rem] m-auto w-full top-[20%] md:top-[50%] left-[50%] -translate-x-1/2 md:-translate-y-1/2 flex flex-col gap-4 justify-center items-center"
    >
      <div className="overflow-hidden text-center md:text-left">
        <div className="text-animation  dark:bg-[linear-gradient(#fff,rgba(255,255,255,.6))] inline-block text-black dark:text-transparent bg-clip-text leading-none text-4xl md:text-6xl font-semibold">
          {t("greeting")}
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="text-animation text-2xl md:text-4xl font-semibold">
          <span className="bg-gradient-to-b from-black to-gray-600 dark:from-white dark:to-gray-400 inline-block text-transparent bg-clip-text">
            {t("role_prefix")}
          </span>{" "}
          <span className="text-accentColor">{t("role")}</span>{" "}
          <span className="bg-gradient-to-b from-black to-gray-600 dark:from-white dark:to-gray-400 inline-block text-transparent bg-clip-text">
            {t("role_suffix")}
          </span>
        </div>
      </div>

      <div
        key={bio}
        aria-label={bio}
        className="w-[300px] md:w-[520px] relative z-30 text-center text-sm leading-6 text-gray-800 dark:text-gray-200"
      >
        {Array.from(bio).map((character, index) => (
          <span
            key={`${character}-${index}`}
            aria-hidden="true"
            className="bio-character inline-block"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            {character === " " ? "\u00a0" : character}
          </span>
        ))}
      </div>

      {t("tagline") && (
        <div className="bio-animation dark:bg-[linear-gradient(#fff,rgba(255,255,255,.6))] inline-block text-black dark:text-transparent bg-clip-text text-md md:text-lg text-center md:text-left">
          {t("tagline")}
        </div>
      )}

      <Link
        href={`mailto:${PROFILE.email}`}
        aria-label="Contact Me"
        className="contact_me_btn px-4 py-[6px] shadow-md mt-10 md:mt-3 group flex items-center gap-2"
      >
        <div className="dark:text-black relative z-[3] text-sm">
          {t("cta")}
        </div>
        <div className="sr-only">Contact Me</div>
        <div className="contact_me_btn_overlay group-hover:opacity-100" />
        <div className="relative group overflow-hidden w-4 z-[3]">
          <div className="flex group-hover:animate-animate-frame-contact-me-btn-icon translate-x-[-100%]">
            <ArrowRightIcon className="text-black flex-none relative z-[3]" />
            <ArrowRightIcon className="text-black flex-none relative z-[3]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
