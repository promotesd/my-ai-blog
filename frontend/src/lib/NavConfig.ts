import { Home, FolderKanban, Newspaper, MoreHorizontal, ImageIcon, Gamepad2, History, BookOpen, BookMarked } from "lucide-react"
import { ComponentType } from "react"

export interface SubMenuItem {
  titleKey: string
  href: string
  icon: ComponentType<{ className?: string; size?: number }>
  descriptionKey: string
}

export interface NavLink {
  titleKey: string
  href: string
  icon: ComponentType<{ className?: string; size?: number }>
  subMenu?: SubMenuItem[]
}

const navlinks: NavLink[] = [
  { titleKey: "home", href: "/", icon: Home },
  { titleKey: "projects", href: "/projects", icon: FolderKanban },
  { titleKey: "blog", href: "/blogs", icon: Newspaper },
  { titleKey: "diary", href: "/diary", icon: BookMarked },
  { titleKey: "guestbook", href: "/guestbook", icon: BookOpen },
  {
    titleKey: "more",
    href: "#",
    icon: MoreHorizontal,
    subMenu: [
      { titleKey: "gallery", href: "/gallery", icon: ImageIcon, descriptionKey: "gallery_desc" },
      { titleKey: "entertainment", href: "/entertainment", icon: Gamepad2, descriptionKey: "entertainment_desc" },
      { titleKey: "timeline", href: "/timeline", icon: History, descriptionKey: "timeline_desc" },
    ],
  },
]

export default navlinks
