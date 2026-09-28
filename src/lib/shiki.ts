/**
 * Shiki 双主题的单一来源。
 *
 * markdown 代码块由 astro.config.mjs 的 markdown.shikiConfig 读取，
 * 首页的 `<Code>` 组件需要显式传同一份 themes —— 两者不一致时
 * 首页代码块会退回内置的 github-dark，在浅色模式下也是深色的。
 */
export const codeThemes = {
  light: 'vitesse-light',
  dark: 'vitesse-dark',
} as const
