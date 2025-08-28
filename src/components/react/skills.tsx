import React, { useEffect } from 'react'
import { technologies } from '../../config/technologies'
import type { Technologies, Category } from '../../types'
import { InfiniteScroll } from '../ui/infinite-scroll'
import { type IconType } from 'react-icons'
import { FaQuestionCircle, FaJava, FaWindows } from 'react-icons/fa'
import {
  SiHtml5,
  SiJavascript,
  SiTypescript,
  SiCss3,
  SiVuedotjs,
  SiReact,
  SiPython,
  SiAstro,
  SiTailwindcss,
  SiGit,
  SiDocker,
  SiPostman,
  SiVercel,
  SiCloudflare,
  SiNetlify,
  SiUbuntu,
  SiNodedotjs,
  SiCplusplus,
  SiApache,
  SiNginx,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiPostgresql,
  SiDiscord,
  SiSpotify,
  SiBrave,
} from 'react-icons/si'
import { 
  Cloud, 
  Code2
} from 'lucide-react'

const iconMap: { [key: string]: IconType } = {
  // Web Development
  'mdi:language-html5': SiHtml5,
  'mdi:language-javascript': SiJavascript,
  'mdi:language-typescript': SiTypescript,
  'mdi:language-css3': SiCss3,
  'mdi:vuejs': SiVuedotjs,
  'mdi:react': SiReact,
  'mdi:language-python': SiPython,
  'mdi:rocket': SiAstro,
  'mdi:tailwind': SiTailwindcss,
  
  // Development Tools
  'mdi:visual-studio-code': Code2,
  'mdi:git': SiGit,
  'mdi:docker': SiDocker,
  'mdi:api': SiPostman,
  
  // Hosting and Cloud Services
  'mdi:triangle': SiVercel,
  'mdi:cloud': Cloud,
  'mdi:cloud-sync': SiCloudflare,
  'mdi:web': SiNetlify,
  
  // Operating Systems
  'mdi:windows': FaWindows,
  'mdi:ubuntu': SiUbuntu,
  
  // Other Programming Languages
  'mdi:nodejs': SiNodedotjs,
  'mdi:language-java': FaJava,
  'mdi:language-cpp': SiCplusplus,
  
  // Web Servers
  'mdi:server': SiApache,
  'mdi:server-network': SiNginx,
  
  // Databases
  'mdi:database': SiMysql,
  'mdi:leaf': SiMongodb,
  'mdi:database-outline': SiRedis,
  'mdi:elephant': SiPostgresql,
  
  // Other Software
  'mdi:discord': SiDiscord,
  'mdi:spotify': SiSpotify,
  'mdi:visual-studio': Code2,
  'mdi:web-box': SiBrave,
}

// 为每个技术定义颜色
const techColors: { [key: string]: string } = {
  'HTML': 'text-orange-500',
  'JavaScript': 'text-yellow-400',
  'TypeScript': 'text-blue-500',
  'CSS': 'text-blue-400',
  'Vue.js': 'text-green-500',
  'React': 'text-cyan-400',
  'Python': 'text-blue-600',
  'Astro': 'text-purple-500',
  'Tailwind CSS': 'text-teal-400',
  'Visual Studio Code': 'text-blue-500',
  'Git': 'text-orange-600',
  'Docker': 'text-blue-400',
  'Postman': 'text-orange-500',
  'Vercel': 'text-black dark:text-white',
  'Aliyun': 'text-orange-500',
  'Cloudflare': 'text-orange-400',
  'Netlify': 'text-teal-500',
  'Windows': 'text-blue-500',
  'Ubuntu': 'text-orange-600',
  'Node.js': 'text-green-500',
  'Java': 'text-red-600',
  'C++': 'text-blue-600',
  'Apache': 'text-red-500',
  'Nginx': 'text-green-600',
  'MySQL': 'text-blue-600',
  'MongoDB': 'text-green-500',
  'Redis': 'text-red-500',
  'PostgreSQL': 'text-blue-700',
  'Discord': 'text-indigo-500',
  'Spotify': 'text-green-500',
  'Visual Studio': 'text-purple-600',
  'Brave': 'text-orange-500',
}

const categories = Object.keys(technologies)
const groupSize = Math.ceil(categories.length / 3)
const categoryGroups = [
  categories.slice(0, groupSize),
  categories.slice(groupSize, groupSize * 2),
  categories.slice(groupSize * 2),
]

const Skills: React.FC = () => {
  useEffect(() => {
    // 添加渐进式动画效果
    const badges = document.querySelectorAll('.tech-badge')
    badges.forEach((badge, index) => {
      badge.classList.add('tech-badge-visible')
      // 为每个徽章添加延迟动画
      ;(badge as HTMLElement).style.animationDelay = `${index * 0.1}s`
    })
  }, [])

  return (
    <div className="z-30 mt-8 flex w-full flex-col max-w-[calc(100vw-2rem)] mx-auto sm:mt-12 sm:max-w-[calc(100vw-5rem)] lg:max-w-full">
      <div className="space-y-3 sm:space-y-4">
        {categoryGroups.map((group, groupIndex) => {
          // 为不同行设置不同的速度，创造层次感
          const baseSpeed = 40
          const speedVariation = groupIndex * 5
          const scrollSpeed = baseSpeed + speedVariation
          
          return (
            <InfiniteScroll
              key={groupIndex}
              speed={scrollSpeed}
              direction={groupIndex % 2 === 0 ? 'left' : 'right'}
              className="flex flex-row justify-center tech-scroll-container"
              pauseOnHover={true}
            >
              {group.flatMap((category) =>
                technologies[category as keyof Technologies].map(
                  (tech: Category, techIndex: number) => {
                    const IconComponent = iconMap[tech.logo] || FaQuestionCircle
                    const colorClass = techColors[tech.text] || 'text-primary'
                    
                    return (
                      <div
                        key={`${category}-${techIndex}`}
                        className="tech-badge repo-card border-border bg-card/90 backdrop-blur-md text-muted-foreground mr-3 flex items-center gap-2 rounded-lg border p-2.5 shadow-sm group mobile-animation sm:mr-4 sm:gap-3 sm:rounded-xl sm:p-3 relative overflow-hidden"
                        data-tech-name={`${category}-${techIndex}`}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {/* 添加微妙的光效背景 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
                        
                        <span className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-md p-1.5 text-base shadow-inner group-hover:bg-muted/70 transition-all duration-300 sm:h-10 sm:w-10 sm:rounded-lg sm:p-2 sm:text-lg relative z-10">
                          <IconComponent className={`tech-icon transition-all duration-300 ${colorClass}`} />
                        </span>
                        <span className="text-foreground font-medium text-xs whitespace-nowrap sm:text-sm relative z-10">
                          {tech.text}
                        </span>
                      </div>
                    )
                  },
                ),
              )}
            </InfiniteScroll>
          )
        })}
      </div>
    </div>
  )
}

export default Skills
