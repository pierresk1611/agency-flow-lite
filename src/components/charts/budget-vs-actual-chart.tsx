'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import SafeResponsiveContainer from '../ui/safe-responsive-container'
import { useRouter } from "next/navigation"

export function BudgetVsActualChart({ data, slug }: { data: any[], slug: string }) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg min-w-0" />

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed rounded-lg min-w-0">
                Žiadne dáta o budgetoch.
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full min-w-0">
          <SafeResponsiveContainer className="h-full">
                    <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        fontWeight={600}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                        tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: number) => [value ? `€${value.toFixed(0)}` : '€0', '']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" fontSize={10} verticalAlign="top" height={36} />
                    <Bar
                        dataKey="planned"
                        name="Naplánovaný"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                    />
                    <Bar
                        dataKey="spent"
                        name="Minutý"
                        fill="#0ea5e9"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                        onClick={(data) => {
                            if (data && data.payload && data.payload.id) {
                                router.push(`/${slug}/jobs/${data.payload.id}`)
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    />
                </BarChart>
      </SafeResponsiveContainer>
        </div>
    )
}
