import { useEffect, useRef } from 'react'

export function useTimer(
  isRunning: boolean,
  onTick: (elapsedSeconds: number) => void,
) {
  const startTimeRef = useRef<number | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    if (!isRunning) {
      if (startTimeRef.current !== null) {
        offsetRef.current += Date.now() - startTimeRef.current
        startTimeRef.current = null
      }
      return
    }

    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = offsetRef.current + (Date.now() - (startTimeRef.current ?? Date.now()))
      onTick(Math.floor(elapsed / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onTick])

  return {
    reset: () => {
      offsetRef.current = 0
      startTimeRef.current = isRunning ? Date.now() : null
    },
  }
}
