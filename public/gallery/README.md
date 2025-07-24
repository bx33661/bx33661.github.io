# 相册图片目录

这个目录用于存放生活相册页面的图片。

## 如何添加图片

1. 将图片文件放入这个目录
2. 在 `src/pages/gallery.astro` 文件中的 `galleryImages` 数组中添加图片配置

## 建议的图片格式

- 格式：JPG, PNG, WebP
- 尺寸：建议正方形比例，最小 600x600px
- 大小：建议不超过 2MB

## 示例配置

```javascript
{
  src: '/gallery/your-image.jpg',
  alt: '图片描述',
  title: '图片标题',
  description: '图片说明',
  date: '2024-01-15'
}
```

## 占位图片

如果图片加载失败，会显示占位图片。请确保有一个 `placeholder-image.jpg` 文件在 public 根目录。 