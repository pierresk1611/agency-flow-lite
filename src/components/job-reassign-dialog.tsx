'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftRight, Loader2, Send, Check } from 'lucide-react'

interface User {
    id: string
    email: string
    name: string | null
    role: string
}

export function JobReassignDialog({
    jobId,
    assignmentId,
    currentUserId,
    isManager
}: {
    jobId: string,
    assignmentId: string,
    currentUserId: string,
    isManager: boolean
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])

    const [targetUserId, setTargetUserId] = useState('')
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (open) {
            fetch('/api/agency/users')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Filter out current assignee
                        setUsers(data.filter((u: User) => u.id !== currentUserId))
                    }
                })
                .catch(err => console.error(err))
        }
    }, [open, currentUserId])

    const handleAction = async () => {
        if (!targetUserId) return
        setLoading(true)

        try {
            const endpoint = isManager
                ? `/api/jobs/${jobId}/reassign`
                : `/api/jobs/${jobId}/reassign-request`

            const method = isManager ? 'PATCH' : 'POST'

            const body = {
                assignmentId,
                targetUserId,
                reason: reason || 'Bez udania dôvodu'
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()

            if (res.ok) {
                alert(isManager ? 'Job bol úspešne presunutý.' : 'Žiadosť o presun bola odoslaná na schválenie.')
                setOpen(false)
                setTargetUserId('')
                setReason('')
                router.refresh()
            } else {
                alert(`Chyba: ${data.error || 'Neznáma chyba'}`)
            }
        } catch (e) {
            console.error(e)
            alert('Nepodarilo sa vykonať akciu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" title={isManager ? "Presunúť job" : "Požiadať o presun"}>
                    <ArrowLeftRight className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isManager ? 'Presunúť job na iného kolegu' : 'Požiadať o presun jobu'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label>Nový riešiteľ</Label>
                        <Select onValueChange={setTargetUserId} value={targetUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte kolegu..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name || u.email} ({u.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Dôvod presunu {isManager ? '(voliteľné)' : '(povinné pre žiadosť)'}</Label>
                        <Textarea
                            placeholder="Napr. Nestíham, choroba, iná priorita..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                </div>
                <DialogFooter>
                    <Button onClick={handleAction} disabled={loading || !targetUserId || (!isManager && !reason.trim())} className={isManager ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isManager ? (
                            <><Check className="mr-2 h-4 w-4" /> Presunúť Job</>
                        ) : (
                            <><Send className="mr-2 h-4 w-4" /> Odoslať Žiadosť</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
