import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { appConfig } from '@/config/app'
import AboutDialog from '@/components/AboutDialog'
import toolboxIcon from '@/assets/icon-toolbox.svg'
import githubIcon from '@/assets/icon-github.svg'

export default function Header() {
  const [aboutOpen, setAboutOpen] = useState(false)
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#1a1a1a] px-4">
      {/* Brand */}
      <NavLink
        to="/"
        className="flex items-center gap-2 text-white/90 transition-colors hover:text-white"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600">
          <img src={toolboxIcon} alt="" aria-hidden="true" className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
      </NavLink>

      <div className="flex-1" />

      {/* GitHub link */}
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="opacity-40 transition-opacity hover:opacity-70"
      >
        <img src={githubIcon} alt="" aria-hidden="true" className="size-4" />
      </a>

      {/* About */}
      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        className="border-l border-white/[0.08] pl-3 text-xs text-white/40 transition-colors hover:text-white/70"
      >
        About
      </button>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  )
}
