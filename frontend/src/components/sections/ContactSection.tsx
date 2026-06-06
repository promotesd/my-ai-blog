"use client"

import { useEffect, useRef } from "react"
import useScrollActive from "@/hooks/UseScrollActive"
import { useSectionStore } from "@/stores/Section"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function ContactSection() {
  gsap.registerPlugin(ScrollTrigger);
  const t = useTranslations("contact");

  // Fix: Properly type the ref
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const q = gsap.utils.selector(sectionRef);
    
    // Create and store the timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        scrub: true,
        onEnter: () => {
          // First animation
          gsap.fromTo(
            q(".title-animation"),
            {
              y: "200%",
            },
            {
              y: 0,
            }
          );

          // Second animation
          gsap.fromTo(
            q(".end-title"),
            { 
              scale: 0 
            }, 
            { 
              scale: 1, 
              ease: "back.inOut" 
            }
          );
        },
      },
    });

    // Cleanup function
    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t: ScrollTrigger) => t.kill());
    };
  }, []);

  // Fix: Type assertion for useScrollActive
  const contactSectionOnView = useScrollActive(sectionRef as React.RefObject<HTMLElement>);
  const { setSection } = useSectionStore();

  useEffect(() => {
    if (contactSectionOnView) {
      setSection("#contact");
    }
  }, [contactSectionOnView, setSection]);

  return (
    <section
      ref={sectionRef}
      id="contacts"
      className="max-h-max bg-gray-100 dark:bg-[#161D1F] py-[140px] px-10 lg:px-[5%]"
    >
      <div className="w-full max-w-[1100px] h-full m-auto flex flex-col gap-40 items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="overflow-hidden">
            <div className="title-animation dark:text-white text-lg">
              {t("collaborate")}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="title-animation text-5xl navlink text-accentColor">
              {t("title")}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 items-center">
          <div className="flex items-center gap-4">
            <Link
              href="https://www.linkedin.com/in/agung-kurniawan-8a798a3b9/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact me on linkedin"
              className="rounded-full group hover:border-accentColor flex items-center gap-2 border py-[1px] px-4"
            >
              <div className="font-semibold group-hover:scale-105 dark:text-white">
                in
              </div>
              <div className="text-xs dark:text-white group-hover:scale-105">
                Linkedin
              </div>
            </Link>

            <Link
              href="https://x.com/Gungzzleefy"
              aria-label="Contact me on Twitter"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full group hover:border-accentColor flex items-center gap-2 border py-[5px] px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                className="stroke-black group-hover:scale-105 dark:stroke-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
              <div className="text-xs dark:text-white group-hover:scale-105">
                Twitter
              </div>
            </Link>

            <Link
              href="https://github.com/agungkurniawanid"
              aria-label="Contact me on Github"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full group flex transition-all items-center gap-2 hover:border-accentColor border py-[5px] px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                className="stroke-black group-hover:scale-105 dark:stroke-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
              </svg>
              <div className="text-xs dark:text-white group-hover:scale-105">
                Github
              </div>
            </Link>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-accentColor text-lg font-semibold">
              Agung Kurniawan
            </div>
            <div className="dark:text-white text-sm">
              {t("role")}
            </div>
          </div>
          <div className="overflow-hidden flex justify-center items-center">
            <div className="title-animation w-full md:max-w-[80%] text-center dark:text-gray-400">
            {t("desc")}
            </div>
          </div>
          <div className="end-title dark:text-white text-md">
            {t("tagline")}
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
          </div>
        </div>
      </div>
    </section>
  )
}
