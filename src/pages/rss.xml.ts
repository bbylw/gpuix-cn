import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { flatNav } from '../lib/nav'
import { SITE_DESCRIPTION, SITE_TITLE } from '../lib/site'

export const GET: APIRoute = async (context) => {
  const docs = await getCollection('docs')
  // 站点没有构建时间戳可供排序，用 nav.ts 的编排顺序。
  // localeCompare 依赖构建机的 ICU 排序数据，会让产物不可复现，因此不用。
  const order = new Map(flatNav.map((item, index) => [item.href, index]))

  const items = docs
    .map((doc) => ({
      title: doc.data.heading ?? doc.data.title,
      description: doc.data.description,
      link: `/docs/${doc.id}`,
      // 订阅者需要 pubDate 才知道新旧；docs 集合没有日期字段，
      // 因此用集合顺序隐含的编排位置，并显式说明这不是发布时间。
      pubDate: new Date(Date.UTC(2026, 0, 1) + (order.get(`/docs/${doc.id}`) ?? 0) * 86_400_000),
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    // 与 astro.config.mjs 的 trailingSlash: 'never' 保持一致，
    // 否则 feed 里的 URL 会和页面 canonical 差一个尾斜杠。
    trailingSlash: false,
    items,
    customData: '<language>zh-cn</language>',
  })
}
