'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { sk } from "date-fns/locale"

interface Task {
    id: string
    title: string
    deadline: Date | null
    campaign: {
        client: {
            name: string
        }
    }
}

export function BurningTasks({ tasks, slug }: { tasks: Task[], slug: string }) {
    if (tasks.length === 0) return null

    return (
        <Card className="shadow-xl border-none ring-1 ring-red-100 bg-red-50/30">
            <CardHeader className="border-b bg-red-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-red-700">
                    <Flame className="h-4 w-4 fill-red-600 animate-pulse" /> Horiace Tasky (do 5 dní)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0">
                <div className="divide-y divide-red-100">
                    {tasks.map(task => {
                        const daysLeft = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : 0

                        return (
                            <div key={task.id} className="p-3 flex items-center justify-between hover:bg-red-50 transition-colors group">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{task.campaign.client.name}</span>
                                    <span className="font-semibold text-sm text-slate-800 group-hover:text-red-700 transition-colors">{task.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-100/50 px-2 py-1 rounded-md">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {task.deadline ? format(new Date(task.deadline), 'd. M.', { locale: sk }) : ''}
                                    </div>
                                    <Link href={`/${slug}/jobs/${task.id}`}>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-red-600 transition-colors" />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
