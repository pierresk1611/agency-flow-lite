'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import SafeResponsiveContainer from '../ui/safe-responsive-container'

const COLORS = { TODO: '#f43f5e', IN_PROGRESS: '#3b82f6', DONE: '#10b981', VYHRANÉ: '#10b981' }

export function JobStatusChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg min-w-0" />

  return (
    <div className="h-[300px] w-full min-w-0">
      <SafeResponsiveContainer className="h-full">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight={600} />
          <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </SafeResponsiveContainer>
    </div>
  )
}