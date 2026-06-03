import { slugifyStr } from "./slugify";

export const TAG_PATH_PREFIX = "/blog/tags";

export const getTagSlug = (tag: string) => slugifyStr(tag);

export const getTagPath = (tag: string) =>
  `${TAG_PATH_PREFIX}/${encodeURIComponent(getTagSlug(tag))}/`;
