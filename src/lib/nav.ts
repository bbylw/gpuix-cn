export interface NavItem {
  title: string
  href: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * 侧边栏导航。它同时被 sitemap 集成用于计算页面优先级，
 * 因此新增文档页面时只需在这里登记一次。
 */
export const docsNav: NavGroup[] = [
  {
    title: '开始',
    items: [
      { title: '快速开始', href: '/docs/quick-start' },
      { title: '从零开始构建', href: '/docs/from-scratch' },
      { title: '示例', href: '/docs/examples' },
      { title: 'Solid 快速开始', href: '/docs/solid' },
    ],
  },
  {
    title: '核心概念',
    items: [
      { title: '架构', href: '/docs/architecture' },
      { title: '支持的元素', href: '/docs/elements' },
      { title: '支持的事件', href: '/docs/events' },
      { title: '支持的样式', href: '/docs/styling' },
    ],
  },
  {
    title: '组件',
    items: [
      { title: '原生动画', href: '/docs/animation' },
      { title: '滚动', href: '/docs/scrolling' },
      { title: '虚拟列表', href: '/docs/virtual-list' },
      { title: '文本输入', href: '/docs/text-input' },
      { title: '原生文本组件', href: '/docs/native-text' },
      { title: '无障碍', href: '/docs/accessibility' },
      { title: '焦点与键盘导航', href: '/docs/focus-keyboard' },
      { title: '无样式控件', href: '/docs/headless-controls' },
      { title: '图像与图标', href: '/docs/images' },
    ],
  },
  {
    title: '窗口与渲染器',
    items: [
      { title: 'render() 与窗口选项', href: '/docs/render' },
      { title: '窗口控制与文件选择器', href: '/docs/window-controls' },
      { title: '后台启动与 agent 驱动', href: '/docs/background' },
      { title: 'flushSync', href: '/docs/flush-sync' },
      { title: '调试帧叠加层', href: '/docs/debug-overlay' },
      { title: '热重载', href: '/docs/hot-reload' },
    ],
  },
  {
    title: '文本能力',
    items: [
      { title: '文本选区', href: '/docs/text-selection' },
      { title: '高亮与搜索', href: '/docs/highlight-search' },
    ],
  },
  {
    title: '自动化',
    items: [
      { title: '自动化', href: '/docs/automation' },
      { title: '测试', href: '/docs/testing' },
    ],
  },
  {
    title: '打包与发布',
    items: [
      { title: '编译为二进制文件', href: '/docs/bundle-binary' },
      { title: '打包成带图标的 App', href: '/docs/packaging' },
      { title: '自动更新', href: '/docs/auto-update' },
    ],
  },
  {
    title: '参考',
    items: [
      { title: '构建 GPUIX 自身', href: '/docs/building' },
      { title: '开发 Rust 侧', href: '/docs/developing-rust' },
      { title: '实现状态', href: '/docs/roadmap' },
    ],
  },
]

/** 扁平化后的有序页面列表，用于上一篇 / 下一篇导航。 */
export const flatNav: NavItem[] = docsNav.flatMap((group) => group.items)
