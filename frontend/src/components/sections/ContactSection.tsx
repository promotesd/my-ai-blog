"use client"

import { useEffect, useRef } from "react"
import useScrollActive from "@/hooks/UseScrollActive"
import { useSectionStore } from "@/stores/Section"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { PROFILE } from "@/config/profile"
import { Mail } from "lucide-react"
import { FaGithub } from "react-icons/fa"

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
      className="max-h-max bg-gray-100 dark:bg-[#161D1F] py-20 px-10 lg:px-[5%]"
    >
      <div className="w-full max-w-[1100px] h-full m-auto flex flex-col gap-8 items-center">
        <div className="flex flex-col items-center">
          <div className="overflow-hidden">
            <div className="title-animation text-center text-2xl font-semibold text-gray-900 dark:text-white">
              {t("collaborate")}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
            <Link
              href={PROFILE.githubUrl}
              aria-label="Contact me on Github"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full group flex transition-all items-center gap-2 hover:border-accentColor border py-[5px] px-4"
            >
              <FaGithub size={15} className="group-hover:scale-105" />
              <div className="text-xs dark:text-white group-hover:scale-105">
                GitHub
              </div>
            </Link>
            <Link
              href={`mailto:${PROFILE.email}`}
              aria-label="Email me"
              className="rounded-full group flex transition-all items-center gap-2 hover:border-accentColor border py-[5px] px-4"
            >
              <Mail size={15} className="group-hover:scale-105" />
              <div className="text-xs dark:text-white group-hover:scale-105">
                {t("email")}
              </div>
            </Link>
        </div>
      </div>
    </section>
  )
}
