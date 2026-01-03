'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Bell, X } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface Notification {
    id: string
    title: string
    message: string
    createdAt: Date
    type?: 'success' | 'info' | 'warning'
}

export function NotificationCenter({ notifications }: { notifications: Notification[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    const handleDismiss = (id: string) => {
        setDismissed(prev => new Set([...prev, id]))
    }

    const visibleNotifications = notifications.filter(n => !dismissed.has(n.id))

    if (visibleNotifications.length === 0) return null

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/50">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
                            Centrum Upozornení
                        </h3>
                        <div className="space-y-2">
                            {visibleNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className="flex items-start justify-between gap-3 p-2 bg-white rounded border border-blue-100"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-blue-900">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {format(new Date(notification.createdAt), 'dd.MM HH:mm')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(notification.id)}
                                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
