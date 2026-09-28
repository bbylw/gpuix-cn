import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'

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

/** 高亮命中的关键词，返回 [前缀, 命中, 后缀] 片段。 */
function splitHighlight(text: string, query: string): [string, string, string] | null {
  const at = text.toLowerCase().indexOf(query.toLowerCase())
  if (at === -1) return null
  const start = Math.max(0, at - 28)
  const end = Math.min(text.length, at + query.length + 40)
  return [
    start > 0 ? '…' : '',
    text.slice(at, at + query.length),
    text.slice(end),
  ]
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
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<Element | null>(null)

  // 全局快捷键：⌘K / Ctrl+K 打开，/ 也可打开
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
    // 避免浏览器自动放大移动端输入框
    const viewport = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]',
    )
    const original = viewport?.content
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1')
    requestAnimationFrame(() => inputRef.current?.focus())
    document.documentElement.style.overflow = 'hidden'

    if (index === null) {
      fetch('/search-index.json')
        .then((response) => response.json())
        .then((data: IndexEntry[]) => setIndex(data))
        .catch(() => setIndex([]))
    }

    return () => {
      document.documentElement.style.overflow = ''
      if (original) viewport?.setAttribute('content', original)
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

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      // Astro 预取已注册，直接整页跳转最稳妥
      window.location.href = href
    },
    [],
  )

  function onListKeyDown(event: React.KeyboardEvent) {
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
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="搜索文档"
        className="group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] border border-line bg-canvas px-2.5 text-sm text-ink-faint transition-colors hover:border-line-strong hover:bg-surface hover:text-ink-soft sm:w-60 sm:px-3"
      >
        <MagnifyingGlassIcon size={17} weight="bold" aria-hidden className="shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">搜索文档</span>
        <kbd className="hidden shrink-0 rounded-[4px] border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ink-muted sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh] pb-8"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-ink/25 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="搜索文档"
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-[6px] border border-line-strong bg-overlay shadow-pop"
            onKeyDown={onListKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlassIcon size={17} weight="bold" aria-hidden className="shrink-0 text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                placeholder="搜索标题、标识符或正文…"
                aria-label="搜索查询"
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
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  正在加载索引…
                </p>
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

              <ul role="listbox" aria-label="搜索结果">
                {results.map((result, i) => {
                  const parts = splitHighlight(result.entry.t, query.trim())
                  return (
                    <li key={result.entry.h}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(result.entry.h)}
                        className={`w-full rounded-[5px] px-3 py-2.5 text-left transition-colors ${
                          i === active ? 'bg-accent-soft' : 'hover:bg-surface'
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
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ink-faint">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line px-1 py-px font-mono">↑↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line px-1 py-px font-mono">↵</kbd>
                打开
              </span>
              <span className="ml-auto">{results.length > 0 && `${results.length} 条结果`}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
