// 重新导出所有配置，保持向后兼容
export { SITE, SEO_KEYWORDS, SOCIAL_PROFILES } from '@/config/site'
export { NAV_LINKS, SOCIAL_LINKS } from '@/config/navigation'
export { FRIEND_LINKS, ORGANIZATION_LINKS } from '@/config/friends'
export { ICON_MAP, technologies } from '@/config/technologies'

// 重新导出类型
export type { FriendLink, OrganizationLink } from '@/config/friends'
