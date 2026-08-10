import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { tools } from '@/config/tools'
import { appConfig } from '@/config/app'

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const tool = tools.find((t) => t.path === pathname)
    document.title = tool ? `${tool.title} — ${appConfig.name}` : appConfig.name
  }, [pathname])
}
