export interface GalleryImageItem {
  file: string
  alt: string
  title: string
  date: string
  width: number
  height: number
  shape?: 'about-shot--wide' | 'about-shot--tall' | ''
}

export interface GalleryImageWithSources extends GalleryImageItem {
  originalSrc: string
  optimizedSrc: string
  avifSrcSet: string
  webpSrcSet: string
  jpgSrcSet: string
  renditionWidths: number[]
}

const GALLERY_RENDITION_WIDTHS = [640, 960, 1280, 1600] as const

const stripExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, '')

const getRenditionWidths = (sourceWidth: number) => {
  const maxWidth = GALLERY_RENDITION_WIDTHS[GALLERY_RENDITION_WIDTHS.length - 1]
  const widths: number[] = GALLERY_RENDITION_WIDTHS.filter((step) => step <= sourceWidth)
  if (sourceWidth <= maxWidth && !widths.includes(sourceWidth)) {
    widths.push(sourceWidth)
  }
  if (widths.length === 0) widths.push(sourceWidth)
  return widths.sort((a, b) => a - b)
}

const buildSrcSet = (baseName: string, widths: number[], format: 'avif' | 'webp' | 'jpg') =>
  widths.map((width) => `/gallery/optimized/${baseName}-w${width}.${format} ${width}w`).join(', ')

export const buildGalleryImageSources = (item: GalleryImageItem): GalleryImageWithSources => {
  const baseName = stripExtension(item.file)
  const renditionWidths = getRenditionWidths(item.width)
  const largestWidth = renditionWidths[renditionWidths.length - 1]

  return {
    ...item,
    originalSrc: `/gallery/${item.file}`,
    optimizedSrc: `/gallery/optimized/${baseName}-w${largestWidth}.jpg`,
    avifSrcSet: buildSrcSet(baseName, renditionWidths, 'avif'),
    webpSrcSet: buildSrcSet(baseName, renditionWidths, 'webp'),
    jpgSrcSet: buildSrcSet(baseName, renditionWidths, 'jpg'),
    renditionWidths,
  }
}

export const GALLERY_IMAGES: GalleryImageItem[] = [
  {
    file: '6C67AEDA-15B9-44A4-9493-B801382DB7EC.jpeg',
    alt: '经幡穹顶',
    title: '经幡穹顶',
    date: '2026-02-15',
    width: 4096,
    height: 3072,
    shape: 'about-shot--wide',
  },
  {
    file: '0228CA38-3A9D-4624-A6B8-0EDD2B1B5296.jpeg',
    alt: '雪山晚霞',
    title: '雪山晚霞',
    date: '2026-02-15',
    width: 8192,
    height: 6144,
    shape: '',
  },
  {
    file: 'C0A851E2-DFC3-4E0B-B37E-3451E1DC3F24.jpeg',
    alt: '峡谷双桥',
    title: '峡谷双桥',
    date: '2026-02-15',
    width: 4096,
    height: 1844,
    shape: '',
  },
  {
    file: '79d35189354e2824167cfebb10876af4.jpg',
    alt: 'Labubu',
    title: 'Labubu',
    date: '2025-07-05',
    width: 1279,
    height: 1706,
    shape: 'about-shot--tall',
  },
  {
    file: '738eadca2488bd4f583bb071d15fc038.jpg',
    alt: '宝泉风景',
    title: '宝泉',
    date: '2025-07-05',
    width: 1820,
    height: 1024,
    shape: 'about-shot--wide',
  },
  {
    file: 'c9531bcaeefed42bb36b974696149c7a.jpg',
    alt: '山间风景',
    title: '山间',
    date: '2025-07-05',
    width: 1820,
    height: 1024,
    shape: '',
  },
  {
    file: '3a05e267fc3eb4a6c146489836f5d50e.jpg',
    alt: '校园',
    title: '校园',
    date: '2025-05-05',
    width: 3024,
    height: 4032,
    shape: '',
  },
  {
    file: 'cd3ca9f14be50495c1be8ed017c7b348.jpg',
    alt: '海南落日',
    title: '落日',
    date: '2024-07-05',
    width: 1896,
    height: 1280,
    shape: 'about-shot--wide',
  },
  {
    file: 'fb450aaf347e5d8e64d0341cf3b23b61.jpg',
    alt: '古都风景',
    title: '古都',
    date: '2024-09-05',
    width: 3264,
    height: 2448,
    shape: '',
  },
  {
    file: 'b4fb8f48829b62de174d7b1e24a3b7ca.jpg',
    alt: '云层光影',
    title: '云层',
    date: '2024-10-05',
    width: 2448,
    height: 3264,
    shape: '',
  },
  {
    file: '2713625f33c9006f62b6e40783e27527.jpg',
    alt: '天际云影',
    title: '云影',
    date: '2024-11-05',
    width: 3072,
    height: 4096,
    shape: '',
  },
]
