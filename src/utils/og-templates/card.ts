import type { CollectionEntry } from "astro:content";
import satori from "satori";
import { SITE } from "@/config.ts";
import loadGoogleFonts from "../loadGoogleFont";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const HOSTNAME = new URL(SITE.website).hostname;

type SatoriNode = Record<string, unknown>;

function renderBackdropOrbs(variant: "post" | "site"): SatoriNode[] {
  if (variant === "post") {
    return [
      {
        type: "div",
        props: {
          style: {
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "600px",
            height: "600px",
            background: "linear-gradient(140deg, #6366f1, #a855f7)",
            filter: "blur(100px)",
            opacity: 0.4,
            borderRadius: "100%",
          },
        },
      },
    ];
  }

  return [
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          top: "-150px",
          right: "-50px",
          width: "600px",
          height: "600px",
          background: "linear-gradient(140deg, #a855f7, #ec4899)",
          filter: "blur(120px)",
          opacity: 0.3,
          borderRadius: "100%",
        },
      },
    },
    {
      type: "div",
      props: {
        style: {
          position: "absolute",
          bottom: "-150px",
          left: "-50px",
          width: "500px",
          height: "500px",
          background: "linear-gradient(140deg, #3b82f6, #6366f1)",
          filter: "blur(120px)",
          opacity: 0.3,
          borderRadius: "100%",
        },
      },
    },
  ];
}

export async function ogImageForPost(post: CollectionEntry<"blog">): Promise<string> {
  const fontText = `${post.data.title}${post.data.author}${HOSTNAME}作者 `;
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
          backgroundColor: "#0f172a",
          color: "white",
          padding: "80px",
          position: "relative",
        },
        children: [
          ...renderBackdropOrbs("post"),
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center" },
              children: {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    padding: "10px 24px",
                    borderRadius: "50px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: { fontSize: 24, fontWeight: 700, color: "#e2e8f0", letterSpacing: "2px" },
                      children: HOSTNAME,
                    },
                  },
                },
              },
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", width: "100%" },
              children: {
                type: "h1",
                props: {
                  style: {
                    fontSize: 84,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    margin: 0,
                    color: "#ffffff",
                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    display: "-webkit-box",
                    lineClamp: 3,
                    boxOrient: "vertical",
                  },
                  children: post.data.title,
                },
              },
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", width: "100%" },
              children: [
                {
                  type: "div",
                  props: {
                    style: { width: "60px", height: "4px", backgroundColor: "#818cf8", marginRight: "24px" },
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { fontSize: 32, color: "#cbd5e1", fontWeight: 400 },
                    children: [
                      "作者 ",
                      {
                        type: "span",
                        props: {
                          style: { fontWeight: 700, color: "white", marginLeft: "8px" },
                          children: post.data.author,
                        },
                      },
                    ],
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
  const fontText = `${SITE.title}${SITE.desc}${HOSTNAME}`;
  return satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          position: "relative",
        },
        children: [
          ...renderBackdropOrbs("site"),
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px",
                width: "90%",
              },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: 100,
                      fontWeight: 700,
                      letterSpacing: "-2px",
                      color: "white",
                      margin: "0 0 20px 0",
                      lineHeight: 1,
                      textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    },
                    children: SITE.title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      width: "80px",
                      height: "6px",
                      backgroundColor: "#818cf8",
                      borderRadius: "4px",
                      marginBottom: "30px",
                    },
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      fontSize: 36,
                      color: "#cbd5e1",
                      maxWidth: "80%",
                      margin: 0,
                      lineHeight: 1.4,
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
                position: "absolute",
                bottom: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "12px 30px",
                borderRadius: "100px",
              },
              children: {
                type: "span",
                props: {
                  style: { fontSize: 24, color: "#94a3b8", fontWeight: 700, letterSpacing: "1px" },
                  children: HOSTNAME,
                },
              },
            },
          },
        ],
      },
    } as never,
    { width: CARD_WIDTH, height: CARD_HEIGHT, embedFont: true, fonts: await loadGoogleFonts(fontText) },
  );
}
