"use client"

import { useEffect, useRef } from "react"
import useOnScreen from "@/hooks/UseOnScreen"
import useScrollActive from "@/hooks/UseScrollActive"
import { useSectionStore } from "@/stores/Section"
import { useBlogStore } from "@/stores/BlogStore"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { ArrowRight } from "iconsax-react"
import Link from "next/link"
import { RoughNotation } from "react-rough-notation"
import BlogCard from "../BlogCard"
import { useTranslations } from "next-intl"

export default function BlogSection() {
  gsap.registerPlugin(ScrollTrigger);
  const t = useTranslations("blog");

  // Fix: Properly type the refs
  const sectionRef = useRef<HTMLElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const { blogs: storeBlogList, fetchBlogs } = useBlogStore();
  
  // Fix: Type assertion for useOnScreen
  const isOnScreen = useOnScreen(elementRef as React.RefObject<HTMLElement>);

  useEffect(() => {
    fetchBlogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sectionRef.current) return;

    const q = gsap.utils.selector(sectionRef);
    
    // Create and store the timeline
    const tl = gsap.timeline({
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

    // Cleanup function
    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t: ScrollTrigger) => t.kill());
    };
  }, []);

  // Fix: Type assertion for useScrollActive
  const aboutSectionOnView = useScrollActive(sectionRef as React.RefObject<HTMLElement>);
  const { setSection } = useSectionStore();

  useEffect(() => {
    if (aboutSectionOnView) {
      setSection("#blog");
    }
  }, [aboutSectionOnView, setSection]);

  return (
    <section
      ref={sectionRef}
      id="blogs"
      className="h-full bg-baseBackground py-14 px-10 lg:px-[5%]"
    >
      <div className="w-full max-w-[1100px] h-full m-auto flex flex-col items-center gap-14">
        <div className="w-[80%] md:w-full flex flex-col gap-8 items-center">
          <RoughNotation
            type="underline"
            strokeWidth={2}
            color="hsl(157, 87%, 41%)"
            order={1}
            show={isOnScreen}
          >
            <div className="text-xl md:text-4xl tracking-tight font-medium w-fit dark:text-accentColor">
              {t("title")}
            </div>
          </RoughNotation>
          <div ref={elementRef} className="overflow-hidden flex flex-col gap-1">
            <div className="qoutes-animation mx-auto text-center text-sm dark:text-white flex flex-col items-center font-normal">
            {t("desc")}
            </div>
            <div className="qoutes-animation mx-auto text-center text-sm dark:text-white flex flex-col items-center font-normal">
              <div>{t("wip")}</div>
            </div>
          </div>
        </div>

        <div className="md:w-full pt-4 pb-10 flex flex-col items-start gap-6">
          {storeBlogList.length > 0 ? (
            storeBlogList.slice(0, 3).map((blog) => (
              <BlogCard key={blog.id} item={blog} />
            ))
          ) : (
            <div className="w-full text-center text-gray-500 dark:text-gray-400 py-10">Belum ada artikel yang ditampilkan.</div>
          )}
        </div>

        <Link
          href='https://www.tiktok.com/@agungkurniawan.id?_t=ZS-8t6x1wpm4z2&_r=1'
          target="_blank"
          aria-label="Follow up on my medium account"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <div className="text-accentColor navlink text-sm italic">
            {t("follow")}
          </div>
          <ArrowRight color="white" size={15} />
        </Link>
      </div>
    </section>
  )
}
