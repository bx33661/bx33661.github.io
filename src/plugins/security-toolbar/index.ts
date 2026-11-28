import type { AstroIntegration } from "astro";

/**
 * Astro Dev Toolbar Integration: Security & Post Auditor
 * Active only during `npm run dev` (`astro dev`). Excluded from static production builds.
 */
export default function securityToolbarIntegration(): AstroIntegration {
  return {
    name: "security-toolbar",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: "security-auditor",
          name: "Security & Post Auditor",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
          entrypoint: new URL("./app.ts", import.meta.url),
        });
      },
    },
  };
}
