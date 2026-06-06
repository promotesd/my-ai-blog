import { createContext, useContext } from "react"

type Messages = Record<string, unknown>

interface IntlContextValue {
  locale: string
  messages: Messages
}

const IntlContext = createContext<IntlContextValue>({ locale: "en", messages: {} })

function readMessage(messages: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part]
    }
    return undefined
  }, messages)
}

export function NextIntlClientProvider({
  locale,
  messages,
  children,
}: {
  locale: string
  messages: Messages
  timeZone?: string
  children: React.ReactNode
}) {
  return (
    <IntlContext.Provider value={{ locale, messages }}>
      {children}
    </IntlContext.Provider>
  )
}

export function useLocale() {
  return useContext(IntlContext).locale
}

export function useTranslations<NestedKey extends string = string>(namespace?: NestedKey) {
  const { messages } = useContext(IntlContext)

  return (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const value = readMessage(messages, fullKey)
    let text = typeof value === "string" ? value : fullKey

    if (values) {
      Object.entries(values).forEach(([name, replacement]) => {
        text = text.replaceAll(`{${name}}`, String(replacement))
      })
    }

    return text
  }
}
