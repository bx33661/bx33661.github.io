import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const isPublishTimePassed = ({ data }: CollectionEntry<"blog">) => {
  const pubDatetime = dayjs(data.pubDatetime).tz(
    data.timezone || SITE.timezone
  );

  return (
    dayjs().tz(SITE.timezone).valueOf() >
    pubDatetime.valueOf() - SITE.scheduledPostMargin
  );
};

const postFilter = (post: CollectionEntry<"blog">) => {
  const { data } = post;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed(post));
};

export default postFilter;
