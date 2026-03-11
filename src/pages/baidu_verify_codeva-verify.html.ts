import type { APIRoute } from 'astro'

export const GET: APIRoute = () => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>百度站长工具验证</title>
</head>
<body>
    <p>百度站长工具验证文件 codeva-verify</p>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
