import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import IconGlobe from "@/assets/icons/IconGlobe.svg";
import IconRss from "@/assets/icons/IconRss.svg";
import { SITE, type ShareChannel, type SocialIconName } from "@/config.ts";
import type { Locale } from "@/i18n";

export interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

const SOCIAL_ICON_MAP: Record<SocialIconName, (_props: Props) => Element> = {
  github: IconGitHub,
  x: IconBrandX,
  linkedin: IconLinkedin,
  mail: IconMail,
  telegram: IconTelegram,
  globe: IconGlobe,
  rss: IconRss,
};

export const SOCIALS: Social[] = SITE.socials
  .filter((item) => Boolean(item.href && item.href !== "mailto:"))
  .map((item) => ({
    name: item.name,
    href: item.href,
    linkTitle: item.label || `${SITE.title} · ${item.name}`,
    icon: SOCIAL_ICON_MAP[item.icon] ?? IconGlobe,
  }));

const SHARE_CHANNEL_DEFINITIONS: Record<
  ShareChannel,
  {
    name: string;
    href: string;
    title: { en: string; zh: string };
    icon: (_props: Props) => Element;
  }
> = {
  whatsapp: {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    title: { en: "Share via WhatsApp", zh: "通过 WhatsApp 分享" },
    icon: IconWhatsapp,
  },
  facebook: {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    title: { en: "Share on Facebook", zh: "分享到 Facebook" },
    icon: IconFacebook,
  },
  x: {
    name: "X",
    href: "https://x.com/intent/post?url=",
    title: { en: "Share on X", zh: "分享到 X" },
    icon: IconBrandX,
  },
  telegram: {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    title: { en: "Share via Telegram", zh: "通过 Telegram 分享" },
    icon: IconTelegram,
  },
  pinterest: {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    title: { en: "Share on Pinterest", zh: "分享到 Pinterest" },
    icon: IconPinterest,
  },
  mail: {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    title: { en: "Share via Email", zh: "通过邮件分享" },
    icon: IconMail,
  },
};

export function getShareLinks(locale: Locale = SITE.i18n.defaultLocale): Social[] {
  const isZh = locale === "zh-CN";
  return SITE.shareLinks.map((channel) => {
    const def = SHARE_CHANNEL_DEFINITIONS[channel];
    return {
      name: def.name,
      href: def.href,
      linkTitle: isZh ? def.title.zh : def.title.en,
      icon: def.icon,
    };
  });
}

export const SHARE_LINKS: Social[] = getShareLinks(SITE.i18n.defaultLocale);
