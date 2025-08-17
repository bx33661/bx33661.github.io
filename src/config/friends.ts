// 友链数据类型定义
export interface FriendLink {
  name: string
  url: string
  description: string
  avatar?: string
  tags?: string[]
}

// 组织链接数据类型定义
export interface OrganizationLink {
  name: string
  url: string
  description: string
  avatar?: string
  tags?: string[]
}

export const ORGANIZATION_LINKS: OrganizationLink[] = [
  {
    name: "HnuSec",
    url: "https://www.hnusec.com/",
    description: "海南大学网络空间安全校队",
    avatar: "https://www.hnusec.com/favicon.ico",
    tags: ["网络安全", "CTF","海南大学"]
  },
  {
    name: "XMCVE",
    url: "https://www.xmcve.com/",
    description: "星盟安全团队",
    avatar: "https://www.xmcve.com/favicon.ico",
    tags: ["安全研究", "联合战队"]
  }
]

export const FRIEND_LINKS: FriendLink[] = [
  {
    name: "Bx",
    url: "http://www.bx33661.com",
    description: "见证星辰大海",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1811753380&s=640",
    tags: ["Web"]
  },
  {
    name: "iam0range",
    url: "https://iam0range.github.io/",
    description: "Stay confident",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=3081999683&s=640",
    tags: ["pwn"]
  },
  {
    name: "Ewoji",
    url: "https://ewoji.cn/",
    description: "下雨天留客天留我不留",
    avatar: "https://q.qlogo.cn/headimg_dl?dst_uin=1060089371&spec=640&img_type=jpg",
    tags: ["Web"]
  },
  {
    name: "Unjoke",
    url: "https://unjoke.cn/",
    description: "等雨也等你",
    avatar: "https://q.qlogo.cn/headimg_dl?dst_uin=2801238549&spec=640&img_type=jpg",
    tags: ["Web"]
  },
  {
    name: "Berial",
    url: "https://berial.cn",
    description: "Stay hungry and cross classes",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1409080135&s=640",
    tags: ["pwn"]
  },
  {
    name: "orxiain.",
    url: "https://orxiain.life",
    description: "",
    avatar: "https://xxx",
    tags: ["web"]
  },
  {
    name: "Natro92",
    url: "https://natro92.fun",
    description: "Carpe diem.",
    avatar: "https://berial123.oss-cn-beijing.aliyuncs.com/img/860dd94f08a30cf4a8b7fd9685aed42.webp",
    tags: ["web"]
  },
  {
    name: "m1n9",
    url: "https://mi1n9.github.io/",
    description: "苍山负雪，明烛天南",
    avatar: "https://q.qlogo.cn/headimg_dl?dst_uin=2605742754&spec=640&img_type=jpg",
    tags: ["Crypto"]
  },
  {
    name: "CrazyCat",
    url: "https://lh864042219.github.io/",
    description: "原批",
    avatar: "https://github.com/LH864042219/PWN-Obsidian/blob/main/picture/QQ.jpg?raw=true",
    tags: ["pwn"]
  }
]