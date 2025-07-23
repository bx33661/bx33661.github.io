import type { APIRoute } from 'astro'

// 百度站长工具验证文件生成
export const GET: APIRoute = ({ params }) => {
  const { id } = params
  
  // 生成百度验证HTML文件
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>百度站长工具验证</title>
</head>
<body>
    <p>百度站长工具验证文件 ${id}</p>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function getStaticPaths() {
  // 这里可以添加您的百度验证码
  // 替换为您实际的百度站长工具验证码
  return [
    { params: { id: 'codeva-verify' } },
  ]
} 