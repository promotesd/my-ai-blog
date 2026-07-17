"use client"

import { NextIntlClientProvider } from "next-intl"
import { useLanguageStore } from "@/stores/LanguageStore"
import enMessages from "../../messages/en.json"
import zhMessages from "../../messages/zh.json"

const allMessages = {
  en: enMessages,
  zh: zhMessages,
}

export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguageStore()
  const activeLocale = locale === "en" ? "en" : "zh"

  return (
    <NextIntlClientProvider locale={activeLocale} messages={allMessages[activeLocale]} timeZone="Asia/Shanghai">
      {children}
    </NextIntlClientProvider>
  )
}
