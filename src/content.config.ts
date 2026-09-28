import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 覆盖 nav.ts 中登记的标题，用于页面 H1 与搜索结果 */
    heading: z.string().optional(),
    /** 上一级 / 下一级导航；缺省时按 nav.ts 的顺序推导 */
    prev: z
      .object({ title: z.string(), href: z.string() })
      .optional(),
    next: z
      .object({ title: z.string(), href: z.string() })
      .optional(),
    /** 首屏标题上方的标签，例如「新手指南」 */
    eyebrow: z.string().optional(),
  }),
})

export const collections = { docs }
