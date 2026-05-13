import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: '张林奕涵',
  description:
    '个人简历与技术博客，记录遥感视觉、多模态学习、视觉语言模型、RAG 与项目实践。',
  href: 'http://localhost:1234',
  author: '张林奕涵',
  locale: 'zh-CN',
  featuredPostCount: 2,
  postsPerPage: 5,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/',
    label: 'home',
  },
  {
    href: '/blog',
    label: 'blog',
  },
  {
    href: '/about',
    label: 'resume',
  },
  {
    href: '/authors',
    label: 'about',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/你的GitHub用户名',
    label: 'GitHub',
  },
  {
    href: 'mailto:zhanglinyihan@gmail.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}