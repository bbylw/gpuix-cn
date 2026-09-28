import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { lockScroll, unlockScroll } from '../lib/scroll-lock'

/** 与 src/pages/search-index.json.ts 的 IndexEntry 一一对应，改一处要改两处。 */
interface IndexEntry {
  t: string
  d: string
  h: string
  g: string
  hs: string[]
  c: string
}

interface Scored {
  entry: IndexEntry
  score: number
  /** 命中所在的二级标题 */
  context?: string
}

const MAX_RESULTS = 12
const HOLDER = 'search-dialog'
const LIST_ID = 'search-results'

/**
 * 命中处的上下文：返回 [前缀, 命中, 后缀]。
 * 前缀与后缀都可能为空串——标题本来就短于窗口宽度，不该出现省略号。
 */
function splitHighlight(text: string, query: string): [string, string, string] | null {
  const at = text.toLowerCase().indexOf(query.toLowerCase())
  if (at === -1) return null
  return [text.slice(0, at), text.slice(at, at + query.length), text.slice(at + query.length)]
}

function score(entry: IndexEntry, query: string): Scored | null {
  const q = query.toLowerCase()
  const title = entry.t.toLowerCase()
  const desc = entry.d.toLowerCase()
  const body = entry.c.toLowerCase()

  const titleHit = title.indexOf(q)
  let score = 0
  let context: string | undefined

  if (titleHit === 0) score += 120
  else if (titleHit > 0) score += 80
  else {
    // 小节标题命中最能说明「这一页正是在讲这个」，
    // 权重要高于摘要里的一次提及。
    const headingHit = entry.hs.find((h) => h.toLowerCase().includes(q))
    if (headingHit) {
      score += 40
      context = headingHit
    }

    if (desc.includes(q)) score += 30

    // 正文命中：统计出现次数，但设上限，避免长文档霸榜
    const hits = body.split(q).length - 1
    if (hits === 0) return null
    score += Math.min(hits, 8) * 8
  }

  return { entry, score, context }
}

export default function Search() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const [active, setActive] = useState(0)
  const [shortcut, setShortcut] = useState('⌘K')
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<Element | null>(null)

  // 快捷键提示要如实反映平台：在 Windows / Linux 上写 ⌘K 是错的。
  // 挂载后再改，避免 SSR HTML 与首次客户端渲染不一致。
  useEffect(() => {
    const apple = /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
    setShortcut(apple ? '⌘K' : 'Ctrl K')
  }, [])

  // 全局快捷键：⌘K / Ctrl+K 打开或关闭，/ 也可打开
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
        return
      }
      if (event.key === '/' && !typing && !open) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActive(0)
      return
    }
    restoreFocus.current = document.activeElement
    requestAnimationFrame(() => inputRef.current?.focus())
    lockScroll(HOLDER)

    if (index === null) {
      fetch('/search-index.json')
        .then((response) => response.json())
        .then((data: IndexEntry[]) => setIndex(data))
        .catch(() => setIndex([]))
    }

    return () => {
      unlockScroll(HOLDER)
      ;(restoreFocus.current as HTMLElement | null)?.focus?.()
    }
  }, [open, index])

  const results = useMemo<Scored[]>(() => {
    if (!index || query.trim().length < 1) return []
    const q = query.trim()
    return index
      .map((entry) => score(entry, q))
      .filter((value): value is Scored => value !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
  }, [index, query])

  const go = useCallback((href: string) => {
    setOpen(false)
    // Astro 预取已注册，直接整页跳转最稳妥
    window.location.href = href
  }, [])

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((n) => Math.min(n + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((n) => Math.max(n - 1, 0))
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault()
      go(results[active].entry.h)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Tab') {
      // aria-modal 声称焦点被关在对话框里，就必须真的关住：
      // 否则 Tab 会走到背后的页面上，屏幕阅读器也在两个上下文间跳。
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), [href]',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  // 活动项变化时把对应 option 滚进视野
  useEffect(() => {
    if (!open) return
    document.getElementById(`search-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="搜索文档"
        aria-haspopup="dialog"
        className="group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-card border border-line bg-canvas px-2.5 text-sm text-ink-faint transition-colors hover:border-line-strong hover:bg-surface hover:text-ink-soft sm:w-60 sm:px-3"
      >
        <MagnifyingGlassIcon size={17} weight="bold" aria-hidden className="shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">搜索文档</span>
        <kbd className="hidden shrink-0 rounded-chip border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ink-muted sm:inline-block">
          {shortcut}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh] pb-8">
          {/* 遮罩只是视觉层，关闭走的是它后面的按钮与 Esc，所以对辅助技术隐藏 */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/25 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="搜索文档"
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-line-strong bg-overlay shadow-pop"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlassIcon size={17} weight="bold" aria-hidden className="shrink-0 text-ink-faint" />
              {/* combobox 模式：焦点始终留在输入框，选项靠 aria-activedescendant 指向，
                  屏幕阅读器才能播报「第 3 项，共 12 项」。 */}
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={LIST_ID}
                aria-activedescendant={results[active] ? `search-option-${active}` : undefined}
                aria-autocomplete="list"
                aria-label="搜索查询"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                placeholder="搜索标题、标识符或正文…"
                autoComplete="off"
                spellCheck={false}
                className="h-12 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] leading-none text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                ESC
              </button>
            </div>

            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {index === null && (
                <div role="status" aria-label="正在加载搜索索引" className="space-y-2 p-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-card px-3 py-2.5">
                      <div
                        className="h-3.5 rounded-chip bg-surface-2"
                        style={{ width: `${72 - i * 14}%` }}
                      />
                      <div className="mt-1.5 h-3 w-1/3 rounded-chip bg-surface-2" />
                    </div>
                  ))}
                </div>
              )}

              {index !== null && query.trim() === '' && (
                <div className="px-3 py-6 text-sm text-ink-faint">
                  <p className="mb-3 font-medium text-ink-muted">提示</p>
                  <ul className="space-y-1.5">
                    <li>支持按 API 名称搜索，例如 motion.div、virtual-list</li>
                    <li>支持按配置项搜索，例如 jsxImportSource、focus: false</li>
                    <li>↑ ↓ 选择，Enter 打开，Esc 关闭</li>
                  </ul>
                </div>
              )}

              {index !== null && query.trim() !== '' && results.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  没有找到与「{query}」相关的内容
                </p>
              )}

              {/* option 必须是 listbox 的直接子元素，所以这里不用 li 包裹。 */}
              <ul id={LIST_ID} role="listbox" aria-label="搜索结果">
                {results.map((result, i) => {
                  const parts = splitHighlight(result.entry.t, query.trim())
                  return (
                    <li
                      key={result.entry.h}
                      id={`search-option-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(result.entry.h)}
                      className={`cursor-pointer rounded-card px-3 py-2.5 transition-colors ${
                        i === active ? 'option-active bg-accent-soft' : 'hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">
                          {parts ? (
                            <>
                              {parts[0]}
                              <mark className="bg-transparent font-semibold text-accent">
                                {parts[1]}
                              </mark>
                              {parts[2]}
                            </>
                          ) : (
                            result.entry.t
                          )}
                        </span>
                        <span className="ml-auto shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-faint">
                          {result.entry.g}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                        {result.entry.d}
                      </p>
                      {result.context && (
                        <p className="mt-0.5 truncate font-mono text-[11px] text-ink-faint">
                          # {result.context}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ink-faint">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line bg-surface px-1 py-px font-mono">↑↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line bg-surface px-1 py-px font-mono">↵</kbd>
                打开
              </span>
              <span className="ml-auto">
                {results.length > 0 && `第 ${active + 1} 项，共 ${results.length} 项`}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
