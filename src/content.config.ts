import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /**
     * 覆盖 nav.ts 中登记的标题，用于页面 H1 与搜索结果。
     * 默认不要写：nav.ts 里的 title 已经是对外标题的唯一来源，
     * 两处都写就会出现漂移。
     */
    heading: z.string().optional(),
    /**
     * 显式指定上一页 / 下一页。默认不要写：缺省时按 nav.ts 的顺序自动推导，
     * 写死会在调整导航顺序时静默失效。
     */
    prev: z.object({ title: z.string(), href: z.string() }).optional(),
    next: z.object({ title: z.string(), href: z.string() }).optional(),
    /** 首屏标题上方的标签，例如「新手指南」 */
    eyebrow: z.string().optional(),
  }),
})

export const collections = { docs }
