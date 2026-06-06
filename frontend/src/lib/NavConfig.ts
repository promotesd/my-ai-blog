import { Home, User, Zap, FolderKanban, Newspaper, Mail, MoreHorizontal, ImageIcon, Award, Gamepad2, History, Wrench, BookOpen, Heart, BookMarked } from "lucide-react"
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
  { titleKey: "about", href: "/about", icon: User },
  { titleKey: "skills", href: "/skills", icon: Zap },
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
      { titleKey: "deployed_projects", href: "/deploy-projects", icon: FolderKanban, descriptionKey: "deployed_projects_desc" },
      { titleKey: "social_media", href: "/contact", icon: Mail, descriptionKey: "social_media_desc" },
      { titleKey: "certificate", href: "/certificate", icon: Award, descriptionKey: "certificate_desc" },
      { titleKey: "entertainment", href: "/entertainment", icon: Gamepad2, descriptionKey: "entertainment_desc" },
      { titleKey: "timeline", href: "/timeline", icon: History, descriptionKey: "timeline_desc" },
      { titleKey: "tools_stack", href: "/tech-stack", icon: Wrench, descriptionKey: "tools_stack_desc" },
      { titleKey: "credit", href: "/credit", icon: Heart, descriptionKey: "credit_desc" },
    ],
  },
]

export default navlinks
