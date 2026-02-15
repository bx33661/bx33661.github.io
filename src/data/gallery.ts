export interface GalleryImageItem {
  file: string
  alt: string
  title: string
  date: string
  shape?: 'about-shot--wide' | 'about-shot--tall' | ''
}

export const GALLERY_IMAGES: GalleryImageItem[] = [
  {
    file: '6C67AEDA-15B9-44A4-9493-B801382DB7EC.jpeg',
    alt: '经幡穹顶',
    title: '经幡穹顶',
    date: '2026-02-15',
    shape: 'about-shot--wide',
  },
  {
    file: '0228CA38-3A9D-4624-A6B8-0EDD2B1B5296.jpeg',
    alt: '雪山晚霞',
    title: '雪山晚霞',
    date: '2026-02-15',
    shape: '',
  },
  {
    file: 'C0A851E2-DFC3-4E0B-B37E-3451E1DC3F24.jpeg',
    alt: '峡谷双桥',
    title: '峡谷双桥',
    date: '2026-02-15',
    shape: '',
  },
  {
    file: '79d35189354e2824167cfebb10876af4.jpg',
    alt: 'Labubu',
    title: 'Labubu',
    date: '2025-07-05',
    shape: 'about-shot--tall',
  },
  {
    file: '738eadca2488bd4f583bb071d15fc038.jpg',
    alt: '宝泉风景',
    title: '宝泉',
    date: '2025-07-05',
    shape: 'about-shot--wide',
  },
  {
    file: 'c9531bcaeefed42bb36b974696149c7a.jpg',
    alt: '山间风景',
    title: '山间',
    date: '2025-07-05',
    shape: '',
  },
  {
    file: '3a05e267fc3eb4a6c146489836f5d50e.jpg',
    alt: '校园',
    title: '校园',
    date: '2025-05-05',
    shape: '',
  },
  {
    file: 'cd3ca9f14be50495c1be8ed017c7b348.jpg',
    alt: '海南落日',
    title: '落日',
    date: '2024-07-05',
    shape: 'about-shot--wide',
  },
  {
    file: 'fb450aaf347e5d8e64d0341cf3b23b61.jpg',
    alt: '古都风景',
    title: '古都',
    date: '2024-09-05',
    shape: '',
  },
  {
    file: 'b4fb8f48829b62de174d7b1e24a3b7ca.jpg',
    alt: '云层光影',
    title: '云层',
    date: '2024-10-05',
    shape: '',
  },
  {
    file: '2713625f33c9006f62b6e40783e27527.jpg',
    alt: '天际云影',
    title: '云影',
    date: '2024-11-05',
    shape: '',
  },
]
