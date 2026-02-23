export const SITE = {
  website: "https://www.bx33661.com/",
  author: "BX",
  profile: "https://github.com/bx33661",
  desc: "我是BX，欢迎来到我的博客！这里分享网络安全、CTF、Web安全等技术研究。",
  title: "BX",
  ogImage: "logonew.jpg",
  lightAndDarkMode: true,
  postPerIndex: 6,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showGalleries: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "编辑这篇文章",
    url: "https://github.com/bx33661/bx33661.github.io/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "zh-CN",
  timezone: "Asia/Shanghai",
  introAudio: {
    enabled: false,
    src: "/audio/intro-web.mp3", // ruta al archivo (relativa a /public)
    label: "INTRO.MP3",
    duration: 30,
  },
} as const;
