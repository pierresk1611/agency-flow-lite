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

export function TrafficRequests() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const router = useRouter()

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests/pending')
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
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
                // Remove from local list
                setRequests(prev => prev.filter(r => r.id !== requestId))
                router.refresh()
            } else {
                alert('Chyba pri spracovaní žiadosti')
            }
        } catch (e) {
            console.error(e)
            alert('Chyba pripojenia')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>
    if (requests.length === 0) return null

    return (
        <Card className="border-amber-200 bg-amber-50/50 mb-8 shadow-sm">
            <CardHeader className="pb-2 border-b border-amber-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Žiadosti o presun ({requests.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-3">
                {requests.map(req => (
                    <div key={req.id} className="bg-white border rounded-md p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-bold text-slate-900">{req.requestByUser.name || req.requestByUser.email}</span>
                                <span>žiada presunúť</span>
                                <Badge variant="outline" className="font-mono text-[10px]">{req.assignment.job.title}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-slate-400 line-through text-xs mr-1">{req.assignment.user.name}</span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{req.targetUser.name || req.targetUser.email}</span>
                            </div>
                            <p className="text-xs text-slate-600 italic">" {req.reason} "</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                                onClick={() => handleProcess(req.id, 'REJECT')}
                                disabled={!!processingId}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleProcess(req.id, 'APPROVE')}
                                disabled={!!processingId}
                            >
                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                Schváliť
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
