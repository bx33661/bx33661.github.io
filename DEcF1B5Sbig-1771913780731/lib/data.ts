export interface Project {
  id: string
  title: string
  clipCount: number
  createdAt: string
  images: string[]
  isGenerating?: boolean
  progress?: number
  eta?: string
  isFailed?: boolean
}

export const projects: Project[] = [
  {
    id: "1",
    title: "Recreation of Historical Events",
    clipCount: 14,
    createdAt: "2024-10-20",
    images: [
      "/rain-portrait-1.png",
      "/rain-portrait-2.png",
      "/rain-portrait-3.png",
      "/rain-portrait-4.png",
      "/rain-portrait-5.png",
    ],
  },
  {
    id: "2",
    title: "How Creators Make Content Go Viral Everywhere",
    clipCount: 6,
    createdAt: "2024-11-15",
    images: [
      "/random-portrait-2.png",
      "/random-portrait-1.png",
      "/random-portrait-3.png",
      "/random-portrait-5.png",
      "/random-portrait-4.png",
      
    ],
  },
  {
    id: "3",
    title: "Trends and Innovations in Gaming for 2026",
    clipCount: 5,
    createdAt: "2024-11-25",
    images: [
      "/green-portrait-1.png",
      "/green-portrait-2.png",
      "/green-portrait-3.png",
      "/green-portrait-4.png",
      "/green-portrait-5.png",
    ],
  },
  {
    id: "4",
    title: "Italian Vibes and Trends",
    clipCount: 8,
    createdAt: "2024-10-25",
    images: [
      "/italy-portrait-1.png",
      "/italy-portrait-2.png",
      "/italy-portrait-3.png",
      "/italy-portrait-4.png",
      "/italy-portrait-5.png",
    ],
  },
  {
    id: "5",
    title: "Tutorial Series: Unlocking Your Creative Potential",
    clipCount: 8,
    createdAt: "2024-11-20",
    images: [
      "/cool-portrait-1.png",
      "/cool-portrait-2.png",
      "/cool-portrait-3.png",
      "/cool-portrait-4.png",
      "/cool-portrait-5.png",
    ],
  },
]
