import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'

const STORAGE_KEY = 'gpuix-theme'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readTheme())
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* 隐私模式下忽略写入失败 */
    }
    setTheme(next)
  }

  const isDark = theme === 'dark'
  const label = mounted ? `切换到${isDark ? '浅色' : '深色'}主题` : '切换主题'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-card text-ink-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {/* 未挂载时两个图标都保持隐藏，避免与服务端 HTML 不一致 */}
      <MoonIcon
        size={17}
        weight="bold"
        aria-hidden
        className={`absolute transition-opacity duration-150 ${
          mounted && isDark ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <SunIcon
        size={17}
        weight="bold"
        aria-hidden
        className={`absolute transition-opacity duration-150 ${
          mounted && !isDark ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  )
}
