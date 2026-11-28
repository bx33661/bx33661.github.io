import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config.ts";

const isPublishTimePassed = ({ data }: CollectionEntry<"blog">) =>
  Date.now() > data.pubDatetime.getTime() - SITE.scheduledPostMargin;

const postFilter = (post: CollectionEntry<"blog">) =>
  !post.data.draft && (import.meta.env.DEV || isPublishTimePassed(post));

export default postFilter;
