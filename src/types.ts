/** Shared site metadata shape (legacy SEO + primary config). */
export type Site = {
  title: string;
  description: string;
  desc?: string;
  href: string;
  website?: string;
  author: string;
  locale: string;
  lang?: string;
  location: string;
  profile?: string;
};
