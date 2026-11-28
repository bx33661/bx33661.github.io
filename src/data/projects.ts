/**
 * Projects page data (/projects/).
 * Logos live under `public/images/projects/` or `public/brand/`.
 */
export interface Project {
  name: string;
  logo: string;
  kind: string;
  summary: string;
  description: string;
  repo: string;
  homepage?: string;
  language: string;
  languageColor: string;
  license?: string;
  updated: string;
  command: string;
  topics: string[];
}

export const PROJECTS: Project[] = [
  {
    name: "astro-orbit",
    logo: "/brand/orbit-logo-192.png",
    kind: "Astro 7 · Starter Template",
    summary: "Bilingual editorial blog & personal knowledge base template.",
    description:
      "Academic paper-like typography, WebGPU star-map shader, Pagefind local search, and modular feature toggles.",
    repo: "https://github.com/your-username/astro-orbit",
    homepage: "https://astro-orbit.example.com/",
    language: "Astro",
    languageColor: "#FF5A03",
    license: "MIT",
    updated: "2026-11-01",
    command: "npm create astro@latest -- --template your-username/astro-orbit",
    topics: ["astro", "tailwindcss", "pagefind", "bilingual"],
  },
  {
    name: "orbit-starfield",
    logo: "/images/projects/star-shader.svg",
    kind: "WebGPU · WGSL Shader",
    summary: "Single-pass deep-field gradient and dot-grid shader for editorial heroes.",
    description:
      "Pre-compiled WGSL shader with pointer parallax, reduced-motion respect, and zero runtime shader compiler overhead.",
    repo: "https://github.com/your-username/astro-orbit",
    language: "WGSL",
    languageColor: "#4F46E5",
    license: "MIT",
    updated: "2026-10-18",
    command: "npm run dev",
    topics: ["webgpu", "wgsl", "generative", "canvas"],
  },
  {
    name: "orbit-cli",
    logo: "/images/projects/pagefind-kit.svg",
    kind: "Node.js CLI · Authoring",
    summary: "Interactive scaffolding, content linting, and gallery optimization toolkit.",
    description:
      "Streamlined publishing utilities for frontmatter validation, responsive AVIF/WebP image sets, and quick site setup.",
    repo: "https://github.com/your-username/astro-orbit",
    language: "JavaScript",
    languageColor: "#F1E05A",
    license: "MIT",
    updated: "2026-10-05",
    command: "npm run cli",
    topics: ["cli", "markdown", "sharp", "validation"],
  },
];
