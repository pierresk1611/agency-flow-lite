'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import SafeResponsiveContainer from '../ui/safe-responsive-container'
import { useRouter } from "next/navigation"

export function BudgetChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 italic text-sm">Zatiaľ žiadne finančné dáta.</div>
  }

  const chartWidth = Math.max(data.length * 60, 600)

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div style={{ width: `${chartWidth}px`, height: '300px' }}>
        <SafeResponsiveContainer className="h-full w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={60} // Zvýšená výška pre dlhé názvy
              tick={{ fontSize: 9, width: 100 }}
            />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={80} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => Number(value).toFixed(2) + '€'}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold' }} />
            <Bar dataKey="plan" name="Plán" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="real"
              name="Realita"
              fill="#0f172a"
              radius={[4, 4, 0, 0]}
              style={{ cursor: 'pointer' }}
              onClick={(d) => router.push(`/${slug}/jobs/${d.id}`)}
            />
          </BarChart>
        </SafeResponsiveContainer>
      </div>
    </div>
  )
}