import { type RefObject, useEffect } from 'react'

/** Calls `onClose` on a mousedown that occurs outside the referenced element. */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return

    function handleMouseDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [ref, onClose, enabled])
}
