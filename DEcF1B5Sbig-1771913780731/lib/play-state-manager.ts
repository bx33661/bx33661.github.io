// Global play state manager for clips
// Ensures only one clip plays at a time across the entire app

let currentPlayingClip: string | null = null
const playStateListeners = new Set<(playingClipId: string | null) => void>()

export function setPlayingClip(clipId: string | null) {
  currentPlayingClip = clipId
  playStateListeners.forEach((listener) => listener(clipId))
}

export function subscribeToPlayState(listener: (playingClipId: string | null) => void) {
  playStateListeners.add(listener)
  return () => playStateListeners.delete(listener)
}

export function getCurrentPlayingClip() {
  return currentPlayingClip
}
