import { useCallback, useEffect, useState } from 'react'

/**
 * Two-click confirm: first call arms an id, second call returns true (confirmed).
 * Auto-disarms after `timeout` ms.
 */
export function useConfirmAction(timeout = 2500) {
  const [armedId, setArmedId] = useState<string | null>(null)

  useEffect(() => {
    if (armedId === null) return
    const timer = setTimeout(() => setArmedId(null), timeout)
    return () => clearTimeout(timer)
  }, [armedId, timeout])

  /** Returns true when this is the confirming (second) click. */
  const arm = useCallback(
    (id: string): boolean => {
      if (armedId === id) {
        setArmedId(null)
        return true
      }
      setArmedId(id)
      return false
    },
    [armedId],
  )

  const disarm = useCallback((id?: string) => {
    setArmedId((current) => (!id || current === id ? null : current))
  }, [])

  return { armedId, arm, disarm } as const
}
