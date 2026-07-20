// 友链数据类型定义
export interface FriendLink {
  name: string;
  url: string;
  description: string;
  avatar?: string;
  tags?: string[];
}

// 组织链接数据类型定义
export interface OrganizationLink {
  name: string;
  url: string;
  description: string;
  avatar?: string;
  tags?: string[];
}

export const ORGANIZATION_LINKS: OrganizationLink[] = [
  {
    name: "HnuSec",
    url: "https://www.hnusec.com/",
    description: "海南大学网络空间安全校队",
    avatar: "/static/HnuSec.jpg",
    tags: ["网络安全", "CTF", "海南大学"],
  },
  {
    name: "XMCVE",
    url: "https://www.xmcve.com/",
    description: "星盟安全团队",
    avatar: "https://www.xmcve.com/favicon.ico",
    tags: ["安全研究", "联合战队"],
  },
];

export const FRIEND_LINKS: FriendLink[] = [
  {
    name: "Bx",
    url: "https://www.bx33661.com",
    description: "见证星辰大海",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1811753380&s=640",
  },
  {
    name: "iam0range",
    url: "https://iam0range.github.io/",
    description: "Stay confident",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=3081999683&s=640",
  },
  {
    name: "Ewoji",
    url: "https://ewoji.cn/",
    description: "下雨天留客天留我不留",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=1060089371&spec=640&img_type=jpg",
  },
  {
    name: "Unjoke",
    url: "https://unjoke.cn/",
    description: "等雨也等你",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=2801238549&spec=640&img_type=jpg",
  },
  {
    name: "Berial",
    url: "https://berial.cn",
    description: "Stay hungry and cross classes",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1409080135&s=640",
  },
  {
    name: "orxiain.",
    url: "https://orxiain.life",
    description: "orororororor",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1193087005&s=640",
  },
  {
    name: "m1n9",
    url: "https://mi1n9.github.io/",
    description: "苍山负雪，明烛天南",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=2605742754&spec=640&img_type=jpg",
  },
  {
    name: "Jatopos",
    url: "https://jatopos.github.io",
    description: "一往无前虎山行，拨开云雾见光明。",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=3636469976&s=640",
  },
  {
    name: "Boogipop",
    url: "https://boogipop.com/",
    description: "Are you still in pain?",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=3576846231&spec=640&img_type=jpg",
    tags: ["Web"],
  },
  {
    name: "weixiao",
    url: "https://www.weixiao3.cn/",
    description: "微笑微笑微笑",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=3515902077&spec=640&img_type=jpg",
    tags: ["安卓"],
  },
];

/**
 * HnuSec members with a personal site.
 * Sourced from https://www.hnusec.com/members (checked 2026-07-20).
 * Skipped: no personal blog, dead host, GitHub profile-only, Natro92,
 * CrazyCat / water / Shin (manual).
 */
export const HNUSEC_MEMBER_LINKS: FriendLink[] = [
  {
    name: "chrizsty",
    url: "https://blog.chrizsty.cn/",
    description: "Hello",
    avatar:
      "https://blog.chrizsty.cn/wp-content/uploads/2025/06/b_7d13bfcfe9ef52a8c15380752054edf5.jpg",
    tags: ["2024", "Web"],
  },
  {
    name: "Q1uJu",
    url: "https://q1uju.cc/",
    description: "原穹舟鸣",
    avatar: "https://www.q1uju.cc/assets/fac4.jpg",
    tags: ["2024", "Crypto"],
  },
  {
    name: "FloatingRaft",
    url: "https://floatingraft.github.io/",
    description: "似舟漂不定，如梗泛何从",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=2184582457&spec=640&img_type=jpg",
    tags: ["2024", "Misc"],
  },
  {
    name: "Monday",
    url: "https://www.mondaying.cn/",
    description: "周1不放假~",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=2792663789&s=640",
    tags: ["2023", "Crypto"],
  },
  {
    name: "AndreiLavig",
    url: "https://andreilavig.github.io/",
    description: "A blog about programming, technology, and life.",
    avatar: "https://i.loli.net/2021/02/24/5O1day2nriDzjSu.png",
    tags: ["2023", "Pwn"],
  },
  {
    name: "CFIT",
    url: "https://cfitsec.cn/",
    description: "Vivala CFIT!",
    avatar:
      "https://cfit.oss-cn-beijing.aliyuncs.com/uploads/2024/09/02/X1w92Vrz_cfitpinkicon.png",
    tags: ["2023", "Crypto"],
  },
  {
    name: "Tree",
    url: "https://treesec.cn/",
    description: "满船清梦压星河",
    avatar: "https://s2.loli.net/2024/05/19/KLAiaqNCOJSZBRc.jpg",
    tags: ["2022", "Reverse"],
  },
  {
    name: "walt",
    url: "https://blog.waltchans.com/",
    description: "粥p",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1420970368&s=640",
    tags: ["2022", "Pwn"],
  },
];
