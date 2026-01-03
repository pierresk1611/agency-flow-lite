'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Request {
    id: string
    reason: string
    createdAt: string
    requestByUser: { name: string, email: string }
    targetUser: { name: string, email: string, id: string }
    assignment: {
        user: { name: string, email: string } // Current holder
        job: {
            id: string
            title: string
            campaign: {
                name: string
                client: { name: string }
            }
        }
    }
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell } from 'lucide-react'

interface Notification {
    id: string
    title: string
    message: string
    link: string | null
    createdAt: string
}

export function TrafficRequests() {
    const [requests, setRequests] = useState<Request[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const router = useRouter()

    const fetchAll = async () => {
        try {
            const [reqRes, notifRes] = await Promise.all([
                fetch('/api/requests/pending'),
                fetch('/api/notifications')
            ])

            if (reqRes.ok) setRequests(await reqRes.json())
            if (notifRes.ok) setNotifications(await notifRes.json())

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const handleProcess = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessingId(requestId)
        try {
            const res = await fetch(`/api/requests/${requestId}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== requestId))
                router.refresh()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setProcessingId(null)
        }
    }

    const handleReadNotification = async (notif: Notification) => {
        // Optimistic navigation
        if (notif.link) {
            router.push(notif.link)
        }

        // Update state & API in background
        try {
            await fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' })
            setNotifications(prev => prev.filter(n => n.id !== notif.id))
        } catch (e) { console.error(e) }
    }

    if (loading) return null
    if (requests.length === 0 && notifications.length === 0) return null

    return (
        <Card className="border-none shadow-xl ring-1 ring-slate-200 mb-8 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-3 border-b">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Centrum Upozornení
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="all" className="w-full">
                    <div className="bg-slate-50 border-b px-4">
                        <TabsList className="bg-transparent h-12 p-0 space-x-6">
                            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 font-bold uppercase text-[10px] tracking-wider text-slate-500 data-[state=active]:text-blue-600">
                                Všetko ({requests.length + notifications.length})
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 font-bold uppercase text-[10px] tracking-wider text-slate-500 data-[state=active]:text-blue-600">
                                Žiadosti ({requests.length})
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 font-bold uppercase text-[10px] tracking-wider text-slate-500 data-[state=active]:text-blue-600">
                                Správy ({notifications.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="all" className="p-0 m-0">
                        {/* MIXED LIST - Just showing requests then notifications for simplicity in 'All' view */}
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                            {requests.map(req => (
                                <RequestItem key={req.id} req={req} onProcess={handleProcess} processingId={processingId} />
                            ))}
                            {notifications.map(notif => (
                                <NotificationItem key={notif.id} notif={notif} onRead={handleReadNotification} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="requests" className="p-0 m-0">
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                            {requests.map(req => (
                                <RequestItem key={req.id} req={req} onProcess={handleProcess} processingId={processingId} />
                            ))}
                            {requests.length === 0 && <div className="p-8 text-center text-xs text-slate-400 italic">Žiadne čakajúce žiadosti.</div>}
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="p-0 m-0">
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                            {notifications.map(notif => (
                                <NotificationItem key={notif.id} notif={notif} onRead={handleReadNotification} />
                            ))}
                            {notifications.length === 0 && <div className="p-8 text-center text-xs text-slate-400 italic">Žiadne nové správy.</div>}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function RequestItem({ req, onProcess, processingId }: { req: Request, onProcess: any, processingId: string | null }) {
    return (
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{req.requestByUser.name || req.requestByUser.email}</span>
                    <Badge variant="outline" className="font-mono text-[10px] border-amber-200 bg-amber-50 text-amber-800">Traffic Request</Badge>
                </div>
                <div className="text-sm font-bold text-slate-900">{req.assignment.job.title}</div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 line-through">{req.assignment.user.name}</span>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    <span className="text-blue-600 font-bold">{req.targetUser.name || req.targetUser.email}</span>
                </div>
                <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500" onClick={() => onProcess(req.id, 'REJECT')} disabled={!!processingId}><X className="h-4 w-4" /></Button>
                <Button size="sm" className="h-8 bg-slate-900 text-white" onClick={() => onProcess(req.id, 'APPROVE')} disabled={!!processingId}>
                    {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}

function NotificationItem({ notif, onRead }: { notif: Notification, onRead: any }) {
    return (
        <div onClick={() => onRead(notif)} className="p-4 flex gap-4 hover:bg-slate-50 transition cursor-pointer group">
            <div className="mt-1 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                <Bell className="h-4 w-4" />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">• {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{notif.message}</p>
            </div>
        </div>
    )
}
