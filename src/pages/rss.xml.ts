import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: { site: URL }) {
  const docs = await getCollection('docs')

  return rss({
    title: 'GPUIX 中文文档',
    description:
      '用 TypeScript 编写 React 或 Solid 组件树，GPUIX 使用 Metal、DirectX 或 Vulkan 将其绘制出来。',
    site: context.site,
    // 与 astro.config.mjs 的 trailingSlash: 'never' 保持一致，
    // 否则 feed 里的 URL 会和页面 canonical 差一个尾斜杠。
    trailingSlash: false,
    items: docs
      .map((doc) => ({
        title: doc.data.heading ?? doc.data.title,
        description: doc.data.description,
        link: `/docs/${doc.id}`,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'zh')),
    customData: '<language>zh-cn</language>',
  })
}
