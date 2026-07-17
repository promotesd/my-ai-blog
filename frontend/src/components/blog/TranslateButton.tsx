interface TranslateButtonProps {
  onTranslate: () => void
  onRevert: () => void
  translating: boolean
  isTranslated: boolean
  targetLang: string | null
  targetLangLabel?: string | null
  error?: string | null
  size?: "sm" | "md"
  /** Extra class for the outer element */
  className?: string
}

export default function TranslateButton(_props: TranslateButtonProps) {
  return null
}
