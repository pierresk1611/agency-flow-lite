"use client"

import React, { useEffect, useRef, useState } from 'react'

type Props = React.PropsWithChildren<{
  className?: string
  minHeight?: number
}>

export default function SafeResponsiveContainer({ children, className = '', minHeight = 140 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      setSize(prev => (prev.width !== w || prev.height !== h) ? { width: w, height: h } : prev)
    }

    measure()

    const ro = new ResizeObserver(() => {
      // throttle via rAF
      requestAnimationFrame(measure)
    })
    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  const ready = size.width > 0 && size.height > 0

  return (
    <div ref={ref} className={`${className} min-w-0 w-full`} style={{ minHeight }}>
      {ready ? React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // @ts-ignore
          return React.cloneElement(child, { width: size.width, height: size.height })
        }
        return child
      }) : <div style={{ width: '100%', height: '100%' }} />}
    </div>
  )
}
