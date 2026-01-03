'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PendingTimesheet {
    id: string
    userName: string
    jobTitle: string
    clientName: string
    duration: string
}

export function PendingApprovals({ timesheets, slug }: { timesheets: PendingTimesheet[], slug: string }) {
    if (timesheets.length === 0) return null

    return (
        <Card className="shadow-lg border-none ring-1 ring-slate-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Čaká na Schválenie
                    </h3>
                    <Link
                        href={`/${slug}/timesheets`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                        Zobraziť všetky
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="space-y-2">
                    {timesheets.slice(0, 5).map(ts => (
                        <Link
                            key={ts.id}
                            href={`/${slug}/timesheets`}
                            className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                        TIMESHEET
                                    </p>
                                    <p className="text-sm font-bold text-slate-700 mt-1">
                                        {ts.userName} ({ts.duration})
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {ts.jobTitle}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {ts.clientName}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
