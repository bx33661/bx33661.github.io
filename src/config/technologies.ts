import type { Technologies, IconMap } from '@/types'

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  Weibo: 'mdi:chat',
  Bilibili: 'mdi:video-outline',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
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