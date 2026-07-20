export interface Artwork {
  id: number
  title: string
  artist: string
  year: number
  /** Display image — keep this modest (card is ~500px). */
  image: string
  srcSet?: string
  sizes?: string
  /** Tiny image for palette extraction only. */
  thumb?: string
  width?: number
  height?: number
}
