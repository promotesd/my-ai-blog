import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { ArrowRight } from "iconsax-react"
import Image from "next/image"
import Link from "next/link"
import { Blog } from "@/types/blog"
import TranslateWidget from "@/components/TranslateWidget"

interface Props {
  item: Blog
}

export default function BlogCard({ item }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  // Translated content — null means "show original"
  const [translated, setTranslated] = useState<{ title: string; excerpt: string } | null>(null)

  const displayTitle   = translated?.title   ?? item.title
  const displayExcerpt = translated?.excerpt ?? item.excerpt

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const tl = gsap.timeline({
      scrollTrigger: { trigger: cardRef.current, start: "70% bottom" },
    })
    tl.fromTo(cardRef.current, { y: "100%" }, { y: 0, ease: "power1.inOut" })
  }, [])

  const dateLabel = new Date(item.publishedAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    // Outer wrapper is NOT a Link so the translate button doesn't navigate
    <div className="w-full overflow-hidden">
      <div
        ref={cardRef}
        className="w-full group flex justify-between items-center hover:bg-gray-500 rounded-md hover:bg-opacity-5 transition-colors p-1 pr-0 md:pr-4"
      >
        <Link
          href={`/blogs/${item.id}`}
          aria-label={item.title}
          className="w-full flex flex-col md:flex-row items-center gap-5"
        >
          <Image
            priority
            width={200}
            height={120}
            className="h-full md:h-full bg-contain w-full md:w-[200px] transition-all group-hover:contrast-125 rounded-md object-cover aspect-video"
            src={item.thumbnail}
            alt={item.title}
          />
          <div className="flex w-full md:w-3/5 flex-col items-start gap-2">
            <div className="dark:text-gray-300">{displayTitle}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-accentColor text-sm">{dateLabel}</span>
              {/* Translate button — stopPropagation prevents navigation */}
              <TranslateWidget
                fields={{ title: item.title, excerpt: item.excerpt }}
                onTranslated={(out) =>
                  setTranslated({ title: out.title, excerpt: out.excerpt })
                }
                onReverted={() => setTranslated(null)}
                size="sm"
              />
            </div>
            <div className="dark:text-gray-400 text-sm line-clamp-2">{displayExcerpt}</div>
          </div>
        </Link>

        <div className="hidden md:flex flex-col items-start gap-2 pl-2">
          <Link
            href={`/blogs/${item.id}`}
            aria-label={`Read ${item.title}`}
            tabIndex={-1}
          >
            <div className="w-7 group-hover:scale-110 transition-transform -rotate-45 h-7 rounded-full bg-accentColor flex justify-center items-center">
              <ArrowRight color="white" size={14} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
