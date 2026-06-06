"use client"

import { formatDistanceToNow } from "date-fns"
import { id as localeId, enUS as localeEn, de as localeDe } from "date-fns/locale"
import { MapPin, Briefcase, Star, ExternalLink, Clock, Phone } from "lucide-react"
import { FaInstagram as Instagram } from "react-icons/fa"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useLanguageStore } from "@/stores/LanguageStore"
import TranslateWidget from "@/components/TranslateWidget"

export interface GuestbookEntry {
  id: string
  name: string
  city: string
  profession: string
  message: string
  mood: string
  rating: number
  card_color: string
  avatar_url: string | null
  referral_source: string
  contact: string | null
  is_approved: boolean
  created_at: string
}

interface Props {
  entry: GuestbookEntry
  isNew?: boolean
}

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  Kagum: { emoji: "😍", label: "Kagum" },
  Senang: { emoji: "😄", label: "Senang" },
  Terinspirasi: { emoji: "🤩", label: "Terinspirasi" },
  Penasaran: { emoji: "🤔", label: "Penasaran" },
  Keren: { emoji: "😎", label: "Keren" },
  Suka: { emoji: "🥰", label: "Suka" },
  Terkejut: { emoji: "😮", label: "Terkejut" },
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#ffffff"
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff"
}

function InitialAvatar({
  name,
  color,
  size = 48,
}: {
  name: string
  color: string
  size?: number
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const textColor = getContrastColor(color)
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 text-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: textColor,
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
          }
        />
      ))}
    </div>
  )
}

export default function GuestbookCard({ entry, isNew = false }: Props) {
  const t = useTranslations("guestbookPage")
  const { locale } = useLanguageStore()
  const dateFnsLocale = locale === "de" ? localeDe : locale === "en" ? localeEn : localeId
  const cardRef = useRef<HTMLDivElement>(null)
  const [translatedMessage, setTranslatedMessage] = useState<string | null>(null)
  const rgb = hexToRgb(entry.card_color)
  const bgStyle = rgb
    ? {
        background: `linear-gradient(135deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.12) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.05) 100%)`,
        borderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
      }
    : {}

  const moodInfo = MOOD_MAP[entry.mood] ?? { emoji: "😊", label: entry.mood }

  useEffect(() => {
    if (!cardRef.current) return
    const el = cardRef.current
    if (isNew) {
      el.style.opacity = "0"
      el.style.transform = "translateY(-20px) scale(0.95)"
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.5s ease, transform 0.5s ease"
        el.style.opacity = "1"
        el.style.transform = "translateY(0) scale(1)"
      })
    } else {
      // Intersection observer fade-in for existing cards
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.transition = "opacity 0.5s ease, transform 0.5s ease"
            el.style.opacity = "1"
            el.style.transform = "translateY(0)"
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      el.style.opacity = "0"
      el.style.transform = "translateY(24px)"
      observer.observe(el)
      return () => observer.disconnect()
    }
  }, [isNew])

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden"
      style={bgStyle}
    >
      {/* Color accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: entry.card_color }}
      />

      {/* Header: avatar + name + mood */}
      <div className="flex items-start gap-3 pt-1">
        <div className="shrink-0">
          {entry.avatar_url ? (
            <div
              className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-1"
              style={{ outlineColor: entry.card_color }}
            >
              <Image
                src={entry.avatar_url}
                alt={entry.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <InitialAvatar name={entry.name} color={entry.card_color} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              {entry.name}
            </span>
            <span
              className="text-base leading-none"
              title={t(`mood_${entry.mood.toLowerCase()}`)}
            >
              {moodInfo.emoji}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <StarRating rating={entry.rating} />
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{entry.city}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Briefcase size={11} className="shrink-0" />
          <span className="truncate">{entry.profession}</span>
        </div>
      </div>

      {/* Message */}
      <div className="relative">
        <blockquote className="relative">
          <span className="absolute -top-1 -left-0.5 text-3xl leading-none text-gray-200 dark:text-gray-700 font-serif select-none">
            "
          </span>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 pl-4">
            {translatedMessage ?? entry.message}
          </p>
        </blockquote>
        <div className="mt-1.5 flex justify-end">
          <TranslateWidget
            fields={{ message: entry.message }}
            onTranslated={(out) => setTranslatedMessage(out.message)}
            onReverted={() => setTranslatedMessage(null)}
            size="sm"
          />
        </div>
      </div>

      {/* Contact */}
      {entry.contact && (
        entry.contact.startsWith("@") ? (
          <a
            href={`https://instagram.com/${entry.contact.slice(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity w-fit"
            style={{ color: entry.card_color }}
            onClick={(e) => e.stopPropagation()}
          >
            <Instagram size={11} className="shrink-0" />
            <span className="truncate font-medium underline underline-offset-2">{entry.contact}</span>
          </a>
        ) : (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: entry.card_color }}>
            <Phone size={11} className="shrink-0" />
            <span className="truncate font-medium">{entry.contact}</span>
          </div>
        )
      )}

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/50">
        {/* Referral badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: `${entry.card_color}20`,
            color: entry.card_color,
          }}
        >
          <ExternalLink size={9} />
          {entry.referral_source}
        </span>

        {/* Time */}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
          <Clock size={9} />
          <span>
            {formatDistanceToNow(new Date(entry.created_at), {
              addSuffix: true,
              locale: dateFnsLocale,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
