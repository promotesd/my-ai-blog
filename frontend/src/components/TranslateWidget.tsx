interface TranslateWidgetProps {
  fields: Record<string, string>
  onTranslated: (out: Record<string, string>) => void
  onReverted: () => void
  size?: "sm" | "md"
  className?: string
}

export default function TranslateWidget(_props: TranslateWidgetProps) {
  return null
}
