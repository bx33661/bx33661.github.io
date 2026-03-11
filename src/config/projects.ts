export interface Project {
  name: string
  url: string
  description: string
  tags?: string[]
  githubUrl?: string
  stars?: number
}

export const PROJECTS: Project[] = [
  {
    name: "Wireshark-MCP",
    url: "https://github.com/bx33661/Wireshark-MCP",
    description: "Wireshark-MCP, Give your AI assistant a packet analyzer. Drop a .pcap file, ask questions in plain English — get answers backed by real tshark data.",
    tags: ["MCP", "Wireshark", "Packet Analysis", "AI"],
    githubUrl: "https://github.com/bx33661/Wireshark-MCP",
    stars: 31
  }
]
