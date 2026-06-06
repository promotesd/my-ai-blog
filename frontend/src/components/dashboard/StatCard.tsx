import Link from "next/link"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  href: string
  className?: string
}

export default function StatCard({ title, value, icon: Icon, href, className }: StatCardProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "bg-[#0d1a1a] border border-white/[0.06] rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1]",
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accentColor/10 flex items-center justify-center border border-accentColor/20">
            <Icon className="text-accentColor" size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-400 truncate">{title}</p>
            <p className="text-2xl font-bold text-white truncate">{value ?? 0}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
