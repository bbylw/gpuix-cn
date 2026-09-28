/**
 * 全局滚动锁。
 *
 * 移动端导航抽屉（Header）与搜索对话框（Search）都可能锁住页面滚动。
 * 两者叠加时必须等所有持有者都释放才解锁 —— 否则关掉搜索会误解锁
 * 仍然打开着的抽屉，页面在遮罩后面开始滚动。
 *
 * 用持有者集合而不是布尔量，于是重复 lock 同一个名字也不会多算一次。
 */
const holders = new Set<string>()

/** 压缩整个页面而不产生滚动条跳动。 */
const scrollbarGap = (): number =>
  window.innerWidth - document.documentElement.clientWidth

let restore: { paddingRight: string; overflow: string } | null = null

function lock(): void {
  if (restore) return
  const root = document.documentElement
  const gap = scrollbarGap()
  const previous = { paddingRight: root.style.paddingRight, overflow: root.style.overflow }
  if (gap > 0) root.style.paddingRight = `${gap}px`
  root.style.overflow = 'hidden'
  restore = previous
}

function unlock(): void {
  if (!restore) return
  document.documentElement.style.paddingRight = restore.paddingRight
  document.documentElement.style.overflow = restore.overflow
  restore = null
}

export function lockScroll(who: string): void {
  holders.add(who)
  lock()
}

export function unlockScroll(who: string): void {
  holders.delete(who)
  if (holders.size === 0) unlock()
}
