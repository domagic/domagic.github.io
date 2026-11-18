import { copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const siteUrl = 'https://domagic.github.io'

// GitHub Pages SPA 回退：未知路径返回 404.html，由前端路由接管渲染
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))

const routes = ['/', '/about', '/blog', '/opinions', '/academic', '/privacy']
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${siteUrl}${r}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

console.log('postbuild: 404.html + sitemap.xml generated')