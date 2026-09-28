import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { docsNav } from '../lib/nav'

export const prerender = true

interface IndexEntry {
  /** 标题 */
  t: string
  /** 描述 */
  d: string
  /** 链接 */
  h: string
  /** 所属分组 */
  g: string
  /** 二级标题，用于结果内的上下文提示 */
  hs: string[]
  /** 去掉 frontmatter 后的正文（源码） */
  c: string
}

/**
 * 构建时生成的客户端搜索索引。
 * 索引保留原始 Markdown 源码，因此像 `jsxImportSource` 这样的
 * 代码标识符也能被搜到——对文档站来说这比纯正文搜索更有用。
 */
export const GET: APIRoute = async () => {
  const docs = await getCollection('docs')

  const groupOf = new Map<string, string>()
  for (const group of docsNav) {
    for (const item of group.items) {
      groupOf.set(item.href, group.title)
    }
  }

  const entries: IndexEntry[] = []

  for (const doc of docs) {
    const href = `/docs/${doc.id}`
    let body = doc.body ?? ''

    // 去掉 import / export 语句，避免包名淹没搜索结果
    body = body
      .split('\n')
      .filter((line) => !/^\s*(import|export)\s/.test(line))
      .join('\n')

    const headings = body
      .split('\n')
      .map((line) => /^#{2,3}\s+(.+?)\s*$/.exec(line)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/`/g, ''))

    entries.push({
      t: doc.data.heading ?? doc.data.title,
      d: doc.data.description,
      h: href,
      g: groupOf.get(href) ?? '文档',
      hs: headings.slice(0, 40),
      c: body,
    })
  }

  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
