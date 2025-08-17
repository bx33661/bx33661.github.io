export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  location: string
}

export type SocialLink = {
  href: string
  label: string
}

export type IconMap = {
  [key: string]: string
}

// 博客相关类型
export interface BlogPost {
  title: string
  description: string
  date: Date
  image?: string
  tags?: string[]
  authors?: string[]
  draft?: boolean
  slug?: string
}

// 项目相关类型
export interface Project {
  name: string
  description: string
  tags: string[]
  image: string
  link: string
  startDate?: Date
  endDate?: Date
}

// 技术栈相关类型
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
