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
| [Bun](https://bun.sh) | 作为包管理器与脚本运行时 |
| Shiki | 由 Astro 内置，提供双主题代码高亮 |

> TypeScript 固定在 6.x 而不是 npm 上的 7.0.2，其余依赖均取最新发行版。
> 完整的 `astro check` 在 TypeScript 6.0.3 下通过，0 errors / 0 warnings。

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
- 静态输出，含 sitemap、RSS、robots.txt 与 Open Graph 图

## 部署

`dist/` 是纯静态产物，可直接托管到任意静态托管平台。
