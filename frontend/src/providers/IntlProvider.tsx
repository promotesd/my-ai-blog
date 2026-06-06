"use client"

import { NextIntlClientProvider } from "next-intl"
import { useLanguageStore } from "@/stores/LanguageStore"
import idMessages from "../../messages/id.json"
import enMessages from "../../messages/en.json"
import deMessages from "../../messages/de.json"
import zhMessages from "../../messages/zh.json"

const allMessages = {
  id: idMessages,
  en: enMessages,
  de: deMessages,
  zh: zhMessages,
}

export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguageStore()

  return (
    <NextIntlClientProvider locale={locale} messages={allMessages[locale]} timeZone="Asia/Jakarta">
      {children}
    </NextIntlClientProvider>
  )
}
