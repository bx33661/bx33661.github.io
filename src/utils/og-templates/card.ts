import type { CollectionEntry } from "astro:content";
import satori from "satori";
import { SITE } from "@/config.ts";
import loadGoogleFonts from "../loadGoogleFont";
import { getVisiblePostTags } from "../tagPath";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const HOSTNAME = new URL(SITE.website).hostname;

type SatoriNode = Record<string, unknown>;

function renderOrbitalBackdrop(): SatoriNode[] {
  return [
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          inset: "0",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(167, 179, 194, 0.16) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        },
      },
    },
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          top: "-140px",
          right: "-80px",
          width: "620px",
          height: "620px",
          borderRadius: "100%",
          background:
            "radial-gradient(circle, rgba(120, 184, 255, 0.22) 0%, rgba(17, 88, 209, 0.08) 45%, transparent 72%)",
        },
      },
    },
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          bottom: "-180px",
          left: "-100px",
          width: "540px",
          height: "540px",
          borderRadius: "100%",
          background: "radial-gradient(circle, rgba(60, 135, 154, 0.18) 0%, transparent 70%)",
        },
      },
    },
    {
      type: "svg",
      props: {
        xmlns: "http://www.w3.org/2000/svg",
        width: "460",
        height: "460",
        viewBox: "0 0 460 460",
        fill: "none",
        style: {
          position: "absolute",
          top: "85px",
          right: "52px",
        },
        children: [
          {
            type: "circle",
            props: {
              cx: "230",
              cy: "230",
              r: "196",
              stroke: "#78b8ff",
              strokeOpacity: "0.22",
              strokeWidth: "1.2",
              strokeDasharray: "2 10",
            },
          },
          {
            type: "circle",
            props: {
              cx: "230",
              cy: "230",
              r: "130",
              stroke: "#d6edff",
              strokeOpacity: "0.18",
              strokeWidth: "1.2",
            },
          },
          {
            type: "ellipse",
            props: {
              cx: "230",
              cy: "230",
              rx: "205",
              ry: "68",
              transform: "rotate(-28 230 230)",
              stroke: "#78b8ff",
              strokeOpacity: "0.34",
              strokeWidth: "1.3",
            },
          },
          {
            type: "ellipse",
            props: {
              cx: "230",
              cy: "230",
              rx: "205",
              ry: "68",
              transform: "rotate(46 230 230)",
              stroke: "#d6edff",
              strokeOpacity: "0.18",
              strokeWidth: "1.1",
            },
          },
          {
            type: "path",
            props: {
              d: "M230 14V58M230 402V446M14 230H58M402 230H446",
              stroke: "#78b8ff",
              strokeOpacity: "0.28",
              strokeWidth: "1.2",
            },
          },
          {
            type: "path",
            props: {
              d: "M108 292L180 198L244 252L318 142L368 202",
              stroke: "#e9edf4",
              strokeOpacity: "0.45",
              strokeWidth: "1.4",
            },
          },
          {
            type: "circle",
            props: { cx: "108", cy: "292", r: "3.5", fill: "#e9edf4" },
          },
          {
            type: "circle",
            props: { cx: "180", cy: "198", r: "4", fill: "#78b8ff" },
          },
          {
            type: "circle",
            props: { cx: "244", cy: "252", r: "3.5", fill: "#e9edf4" },
          },
          {
            type: "circle",
            props: { cx: "368", cy: "202", r: "3.5", fill: "#78b8ff" },
          },
          {
            type: "path",
            props: {
              d: "M318 126L322 138L334 142L322 146L318 158L314 146L302 142L314 138Z",
              fill: "#78b8ff",
            },
          },
        ],
      },
    },
  ];
}

function renderHostBadge(label: string): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 22px",
        borderRadius: "999px",
        border: "1px solid rgba(120, 184, 255, 0.28)",
        backgroundColor: "rgba(26, 35, 47, 0.85)",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              backgroundColor: "#78b8ff",
            },
          },
        },
        {
          type: "span",
          props: {
            style: {
              fontSize: 22,
              fontWeight: 700,
              color: "#e9edf4",
              letterSpacing: "1.5px",
            },
            children: label,
          },
        },
      ],
    },
  };
}

export async function ogImageForPost(post: CollectionEntry<"blog">): Promise<string> {
  const tags = getVisiblePostTags(post.data.tags, 3);
  const tagText = tags.map((tag) => `#${tag}`).join("");
  const kicker = "WRITING / POST";
  const metaLine = `${post.data.author} · ${SITE.title}`;
  const fontText = `${post.data.title}${tagText}${metaLine}${kicker}${HOSTNAME}`;
  const titleFontSize = post.data.title.length > 34 ? 54 : 66;

  return satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#131922",
          color: "#e9edf4",
          padding: "68px 76px",
          position: "relative",
        },
        children: [
          ...renderOrbitalBackdrop(),
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "18px",
                position: "relative",
              },
              children: [
                renderHostBadge(HOSTNAME),
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#78b8ff",
                      letterSpacing: "2.4px",
                    },
                    children: kicker,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                maxWidth: "790px",
                position: "relative",
              },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: titleFontSize,
                      fontWeight: 700,
                      lineHeight: 1.24,
                      margin: 0,
                      color: "#e9edf4",
                    },
                    children: post.data.title,
                  },
                },
                ...(tags.length > 0
                  ? [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                          },
                          children: tags.map((tag) => ({
                            type: "span",
                            props: {
                              style: {
                                fontSize: 20,
                                fontWeight: 400,
                                color: "#a7b3c2",
                                padding: "6px 16px",
                                borderRadius: "999px",
                                border: "1px solid rgba(167, 179, 194, 0.25)",
                                backgroundColor: "rgba(26, 35, 47, 0.72)",
                              },
                              children: `#${tag}`,
                            },
                          })),
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "20px",
                position: "relative",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "52px",
                      height: "3px",
                      borderRadius: "2px",
                      backgroundColor: "#78b8ff",
                    },
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#e9edf4",
                    },
                    children: metaLine,
                  },
                },
              ],
            },
          },
        ],
      },
    } as never,
    { width: CARD_WIDTH, height: CARD_HEIGHT, embedFont: true, fonts: await loadGoogleFonts(fontText) },
  );
}

export async function ogImageForSite(): Promise<string> {
  const kicker = SITE.ogKicker;
  const fontText = `${SITE.title}${SITE.desc}${HOSTNAME}${kicker}`;
  return satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#131922",
          color: "#e9edf4",
          padding: "72px 80px",
          position: "relative",
        },
        children: [
          ...renderOrbitalBackdrop(),
          renderHostBadge(HOSTNAME),
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                maxWidth: "740px",
                position: "relative",
              },
              children: [
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#78b8ff",
                      letterSpacing: "2.4px",
                    },
                    children: kicker,
                  },
                },
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: 96,
                      fontWeight: 700,
                      letterSpacing: "-2px",
                      color: "#e9edf4",
                      margin: 0,
                      lineHeight: 1.05,
                    },
                    children: SITE.title,
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      fontSize: 28,
                      color: "#a7b3c2",
                      margin: 0,
                      lineHeight: 1.5,
                      fontWeight: 400,
                    },
                    children: SITE.desc,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                width: "72px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: "#78b8ff",
                position: "relative",
              },
            },
          },
        ],
      },
    } as never,
    { width: CARD_WIDTH, height: CARD_HEIGHT, embedFont: true, fonts: await loadGoogleFonts(fontText) },
  );
}
