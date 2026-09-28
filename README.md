# GPUIX 中文文档站

把 GPUIX 官方 README 整理成一套中文文档站点。内容源自
[remorses/gpuix](https://github.com/remorses/gpuix) 的 README，示例与 API 以英文原文为准。

## 技术栈

| 依赖 | 版本 |
|---|---|
| [Astro](https://astro.build) | 7.3.5 |
| [React](https://react.dev) / [react-dom](https://react.dev) | 19.3.0 |
| [Tailwind CSS](https://tailwindcss.com) | 4.3.3（经 `@tailwindcss/vite`） |
| [TypeScript](https://typescriptlang.org) | **6.0.3** |
| [astro-icon](https://astro-icon.net) + [Phosphor](https://phosphoricons.com)（`@iconify-json/ph`、`@phosphor-icons/react`） | 全站唯一图标家族 |
| [Bun](https://bun.sh) | 作为包管理器与脚本运行时 |
| Shiki | 由 Astro 内置，`vitesse-light` / `vitesse-dark` 双主题 |

> TypeScript 固定在 6.x 而不是 npm 上的 7.0.2，其余依赖均取最新发行版。
> 完整的 `astro check` 在 TypeScript 6.0.3 下通过，0 errors / 0 warnings。

## 设计系统

所有视觉决策集中在 `src/styles/global.css` 的 `@theme` 里，组件只用令牌，不写裸色值。

- **中性色恒为冷 zinc**，浅色从 `#fafafa` 起、深色从 `#0b0c0e` 起，不用纯黑纯白。
- **全站一个强调色**：ember `#b8400f`（浅色）/ `#f58a4b`（深色），双向过 WCAG AA。
  `green` / `amber` / `rose` 是 Callout 与复制反馈的语义色，不参与品牌表达。
- **一个圆角档位**：`--radius-card: 6px`，按钮、卡片、代码框、输入框共用。
- **字体**：不加载拉丁 webfont。正文以中文为主，CJK webfont 是数 MB 的代价，
  而且会让「拉丁字形用 webfont、汉字用系统字体」的风格断裂暴露无遗。
  身份由 `--font-mono`（标签、数值、键名）与字号字重承担。
- **动效**：阅读进度条用 CSS 滚动驱动（`animation-timeline: scroll(root)`，
  必须写长属性，`animation` 简写会把 timeline 重置回 `auto`），不挂 `scroll` 监听；
  首屏入场用 `@media (prefers-reduced-motion: no-preference)` 包裹；
  TOC 高亮用 IntersectionObserver。

## 命令

```bash
bun install       # 安装依赖
bun run dev       # 启动开发服务器
bun run build     # 构建静态站点到 dist/
bun run preview   # 预览构建结果
bun run check     # astro check（类型检查）
```

## 目录结构

```text
src/
├─ assets/                  构建期优化的站内图片（astro:assets）
├─ components/
│  ├─ Header.astro        顶部导航、搜索入口、主题切换、阅读进度
│  ├─ Sidebar.astro       左侧导航（由 lib/nav.ts 驱动）
│  ├─ Toc.astro          右侧「本页内容」与滚动高亮
│  ├─ CodeEnhance.astro  为代码块注入语言标签与复制按钮
│  ├─ Search.tsx         ⌘K 搜索对话框（React 岛屿）
│  ├─ ThemeToggle.tsx    深/浅色切换（React 岛屿）
│  └─ mdx/               MDX 组件：Callout、Feature
├─ content/docs/          33 篇中文文档（.mdx）
├─ layouts/               Base（外壳）、Docs（文档页布局）
├─ lib/nav.ts             导航结构，同时供 sitemap 计算优先级
├─ pages/                 首页、404、动态路由、搜索索引、RSS
└─ styles/global.css      设计令牌与文档排版
```

## 新增一篇文档

1. 在 `src/content/docs/` 下新建 `xxx.mdx`，frontmatter 需要 `title` 与 `description`。
2. 在 `src/lib/nav.ts` 的对应分组里登记 `{ title, href: '/docs/xxx' }`。
3. `bun run build` —— 侧边栏、上一篇/下一篇、sitemap 优先级与搜索索引都会自动更新。

## 特性

- 深/浅色双主题，主题在首次绘制前套用，无白屏闪烁
- ⌘K / Ctrl+K / `/` 打开搜索；索引在构建期生成，支持按 API 标识符检索
- 桌面三栏布局（导航 / 正文 / 目录），移动端抽屉式导航
- Shiki 双主题代码高亮 + 一键复制
- 静态输出，含 sitemap、RSS、robots.txt 与 Open Graph 预览图

## 社交预览图

`public/og-default.png`（1200×630）是 `og:image` / `twitter:image` 指向的文件——
社交平台不解析 SVG，所以这里必须是位图。它的矢量母版是 `public/og-default.svg`，
改完 SVG 之后用任意无头 Chromium 重新光栅化一次：

```bash
# 把 SVG 包进一个 1200×630 的 HTML，再截图
playwright screenshot --viewport-size=1200,630 file:///.../og.html public/og-default.png
```

## 部署

`dist/` 是纯静态产物，可直接托管到任意静态托管平台。
