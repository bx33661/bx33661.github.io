import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'BX❤️',
  description:
    "我是BX \n 欢迎各位来到我的博客 \n 我会分享一些所见所学和所得 \n 欢迎来到我的博客，和我一起学习、成长、分享\n 一起见证星辰大海！！！🙂",
  href: 'https://www.bx33661.com',
  author: 'BX',
  locale: 'zh-CN',
  location: 'China',
}

// SEO关键词配置
export const SEO_KEYWORDS = [
  'bx', 'BX', 'bx33661','bpple','bx33661.com',
  '安全研究', '网络安全', '信息安全', 'CTF',
  'Web安全', '应急响应', '安全分析', '渗透测试',
  '技术分享', '技术博客', '编程', 'Python',
  '安全工具', '漏洞分析', '恶意软件分析',
  '网络攻防', '安全运维', '云安全'
]

// 社交媒体配置
export const SOCIAL_PROFILES = {
  github: 'https://github.com/bx33661',
  email: 'mailto:bx33661@gmail.com',
  // 可以添加更多社交媒体链接
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/',
    label: '首页',
  },
  {
    href: '/about',
    label: '关于我',
  },
  {
    href: '/projects',
    label: '项目',
  },
  {
    href: '/blog',
    label: '博客',
  },
  {
    href: '/archive',
    label: '归档',
  },
  {
    href: '/gallery',
    label: '相册',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/bx33661',
    label: 'GitHub',
  },
  {
    href: 'mailto:bx33661@gmail.com',
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
  Weibo: 'mdi:chat',
  Bilibili: 'mdi:video-outline',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

export interface Category {
  text: string
  logo: string
}

export type Technologies = {
  'Web Development': Category[]
  'Development Tools': Category[]
  'Hosting and Cloud Services': Category[]
  'Operating Systems': Category[]
  'Other Programming Languages and Technologies': Category[]
  'Web Servers': Category[]
  Databases: Category[]
  'Other Software': Category[]
}

export const technologies: Technologies = {
  'Web Development': [
    { text: 'HTML', logo: 'mdi:language-html5' },
    { text: 'JavaScript', logo: 'mdi:language-javascript' },
    { text: 'TypeScript', logo: 'mdi:language-typescript' },
    { text: 'CSS', logo: 'mdi:language-css3' },
    { text: 'Vue.js', logo: 'mdi:vuejs' },
    { text: 'React', logo: 'mdi:react' },
    { text: 'Python', logo: 'mdi:language-python' },
    { text: 'Astro', logo: 'mdi:rocket' },
    { text: 'Tailwind CSS', logo: 'mdi:tailwind' },
  ],
  'Development Tools': [
    { text: 'Visual Studio Code', logo: 'mdi:visual-studio-code' },
    { text: 'Git', logo: 'mdi:git' },
    { text: 'Docker', logo: 'mdi:docker' },
    { text: 'Postman', logo: 'mdi:api' },
  ],
  'Hosting and Cloud Services': [
    { text: 'Vercel', logo: 'mdi:triangle' },
    { text: 'Aliyun', logo: 'mdi:cloud' },
          { text: 'Cloudflare', logo: 'mdi:cloud-sync' },
      { text: 'Netlify', logo: 'mdi:web' },
  ],
  'Operating Systems': [
    { text: 'Windows', logo: 'mdi:windows' },
    { text: 'Ubuntu', logo: 'mdi:ubuntu' },
  ],
  'Other Programming Languages and Technologies': [
    { text: 'Node.js', logo: 'mdi:nodejs' },
    { text: 'Java', logo: 'mdi:language-java' },
    { text: 'C++', logo: 'mdi:language-cpp' },
  ],
  'Web Servers': [
    { text: 'Apache', logo: 'mdi:server' },
    { text: 'Nginx', logo: 'mdi:server-network' },
  ],
  Databases: [
    { text: 'MySQL', logo: 'mdi:database' },
    { text: 'MongoDB', logo: 'mdi:leaf' },
    { text: 'Redis', logo: 'mdi:database-outline' },
    { text: 'PostgreSQL', logo: 'mdi:elephant' },
  ],
  'Other Software': [
    { text: 'Discord', logo: 'mdi:discord' },
    { text: 'Spotify', logo: 'mdi:spotify' },
    { text: 'Visual Studio', logo: 'mdi:visual-studio' },
    { text: 'Brave', logo: 'mdi:web-box' },
  ],
}