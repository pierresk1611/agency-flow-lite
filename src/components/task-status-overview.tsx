'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ListChecks } from 'lucide-react'

interface TaskStatusData {
    name: string
    value: number
}

interface OverdueProject {
    id: string
    title: string
    clientName: string
    deadline: Date
}

interface TaskStatusOverviewProps {
    statusData: TaskStatusData[]
    overdueProjects: OverdueProject[]
    slug: string
}

const COLORS = {
    TODO: '#f43f5e',        // Red
    IN_PROGRESS: '#3b82f6', // Blue
    DONE: '#10b981'         // Green
}

const BG_COLORS = {
    TODO: 'bg-red-50',
    IN_PROGRESS: 'bg-blue-50',
    DONE: 'bg-green-50'
}

const TEXT_COLORS = {
    TODO: 'text-red-600',
    IN_PROGRESS: 'text-blue-600',
    DONE: 'text-green-600'
}

export function TaskStatusOverview({ statusData, overdueProjects, slug }: TaskStatusOverviewProps) {
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl" />

    const todoCount = statusData.find(d => d.name === 'TODO')?.value || 0
    const workCount = statusData.find(d => d.name === 'IN_PROGRESS')?.value || 0
    const doneCount = statusData.find(d => d.name === 'DONE')?.value || 0

    return (
        <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                    <ListChecks className="h-4 w-4" /> STAV ÚLOH
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                    {/* LEFT SIDE: CHART & CARDS */}
                    <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-100">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                        fontWeight={800}
                                        tickFormatter={(val) => val.replace('_', ' ')}
                                    />
                                    <YAxis axisLine={false} tickLine={false} fontSize={11} width={30} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={80}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* SUMMARY CARDS */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            <div className={`${BG_COLORS.TODO} p-3 rounded-xl border border-red-100 flex flex-col items-center justify-center`}>
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">TODO</span>
                                <span className="text-2xl font-black text-red-600">{todoCount}</span>
                            </div>
                            <div className={`${BG_COLORS.IN_PROGRESS} p-3 rounded-xl border border-blue-100 flex flex-col items-center justify-center`}>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">WORK</span>
                                <span className="text-2xl font-black text-blue-600">{workCount}</span>
                            </div>
                            <div className={`${BG_COLORS.DONE} p-3 rounded-xl border border-green-100 flex flex-col items-center justify-center`}>
                                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">DONE</span>
                                <span className="text-2xl font-black text-green-600">{doneCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: OVERDUE PROJECTS */}
                    <div className="lg:w-[400px] flex flex-col">
                        <div className="p-6 border-b border-slate-50">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                PROJEKTY PO DEADLINE ({overdueProjects.length})
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[380px] p-6 space-y-3 custom-scrollbar">
                            {overdueProjects.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic py-12">
                                    Žiadne projekty po deadline.
                                </div>
                            ) : (
                                overdueProjects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => router.push(`/${slug}/jobs/${project.id}`)}
                                        className="group bg-white border border-red-100 rounded-xl p-4 flex items-center justify-between hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 mr-4">
                                            <div className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors">
                                                {project.title}
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                                {project.clientName}
                                            </div>
                                        </div>
                                        <div className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold shadow-sm flex-shrink-0">
                                            {format(new Date(project.deadline), 'dd.MM.yyyy')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e2e8f0;
        }
      `}</style>
        </Card>
    )
}
