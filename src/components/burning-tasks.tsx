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
        <Card className="shadow-lg border-none ring-1 ring-slate-200">
            <CardContent className="p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4 text-red-600" />
                    Burning Tasks ({tasks.length})
                </h3>
                <div className="space-y-2">
                    {tasks.slice(0, 5).map(task => {
                        return (
                            <Link
                                key={task.id}
                                href={`/${slug}/jobs/${task.id}`}
                                className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-900">
                                                {task.title}
                                            </span>
                                            <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4 border-none">
                                                {task.deadline ? format(new Date(task.deadline), 'dd.MM.') : ''}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {task.campaign.client.name}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
