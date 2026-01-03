'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, Pencil, Loader2 } from 'lucide-react'
import { BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import SafeResponsiveContainer from './ui/safe-responsive-container'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"


// TLAČIDLO PRE DELETE (s auto-refreshom)
const DeleteButton = ({ entryId }: { entryId: string }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Naozaj vymazať túto naplánovanú položku?")) return
        setLoading(true)
        try {
            const res = await fetch(`/api/planner/${entryId}`, { method: 'DELETE' })
            if (res.ok) router.refresh()
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    return (
        <div className="flex items-center">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-red-500" /> : (
                <Trash2
                    className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600"
                    onClick={handleDelete}
                />
            )}
        </div>
    )
}

// DIALÓG PRE EDITÁCIU
const EditDialog = ({ entry, allJobs, onSave }: { entry: any, allJobs: any[], onSave: () => void }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [jobId, setJobId] = useState(entry.jobId || 'INTERNAL')
    const [date, setDate] = useState(format(new Date(entry.date), 'yyyy-MM-dd'))
    const [minutes, setMinutes] = useState(entry.minutes.toString())
    const [title, setTitle] = useState(entry.title || '')

    const handleSave = async () => {
        setLoading(true)
        const finalJobId = jobId === 'INTERNAL' ? null : jobId;
        try {
            const res = await fetch(`/api/planner/${entry.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: finalJobId, date, minutes, title })
            })
            if (res.ok) {
                setOpen(false)
                onSave() // Volá refresh
            } else {
                alert("Chyba pri úprave.")
            }
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upraviť záznam</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Job</Label>
                        <Select onValueChange={setJobId} value={jobId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL">INTERNÁ PRÁCA</SelectItem>
                                {allJobs.map(job => (<SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2"><Label>Popis</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Dátum</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Minúty</Label><Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white w-full">Uložiť zmeny</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function PlannerDisplay({ initialEntries, allJobs, readOnly = false }: { initialEntries: any[], allJobs: any[], readOnly?: boolean }) {
    const router = useRouter() // Musíme importovať router kvôli onSave v EditDialog
    const [entries] = useState(initialEntries)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Start Monday
    // 2 weeks view (14 days)
    const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i))

    // LOGIKA GRAFU
    const plannedHoursData = days.map(day => {
        const totalMinutes = entries
            .filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
            .reduce((sum, e) => sum + e.minutes, 0)
        return { name: format(day, 'E'), hodiny: totalMinutes / 60, minutes: totalMinutes }
    })

    if (!isMounted) return <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Kapacita (2 týždne)</CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white font-bold text-xs">{Math.floor(plannedHoursData.reduce((s, i) => s + i.minutes, 0) / 60)}h</Badge>
                </CardHeader>
                <CardContent className="pt-4 h-[250px] min-w-0">
                    <SafeResponsiveContainer className="h-full">
                        <BarChart data={plannedHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="hodiny" name="Hodiny" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </SafeResponsiveContainer>
                </CardContent>
            </Card>

            <div className="w-full overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const dayEntries = entries.filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === dayStr)
                        const isToday = dayStr === format(today, 'yyyy-MM-dd')
                        const isPast = day < new Date(today.setHours(0, 0, 0, 0))

                        return (
                            <Card
                                key={day.toString()}
                                className={`w-[200px] min-h-[250px] shadow-md flex-shrink-0 transition-all 
                                    ${isToday ? 'ring-2 ring-blue-500' : ''} 
                                    ${isPast ? 'opacity-60 grayscale' : ''}
                                `}
                            >
                                <CardHeader className="p-3 border-b bg-slate-50/50">
                                    <p className="text-[10px] font-black uppercase text-slate-400">{format(day, 'EEEE')}</p>
                                    <p className="text-sm font-bold">{format(day, 'd. MMMM')}</p>
                                </CardHeader>
                                <CardContent className="p-2 space-y-2">
                                    {dayEntries.length === 0 ? (
                                        <p className="text-center py-6 text-slate-400 text-xs italic">Voľný deň.</p>
                                    ) : (
                                        dayEntries.map(e => {
                                            // Color Logic
                                            const plan = e.minutes
                                            const real = e.realMinutes || 0

                                            let borderClass = "border-slate-200"
                                            if (real > plan) borderClass = "border-red-400 bg-red-50"
                                            else if (real > 0 && real <= plan) borderClass = "border-blue-400 bg-blue-50"

                                            // Content Title
                                            const jobName = e.job?.campaign?.client?.name || 'Interná práca'

                                            return (
                                                <div key={e.id} className={`p-2 border rounded text-[10px] shadow-sm flex flex-col gap-2 ${borderClass}`}>
                                                    <div className="w-full">
                                                        <p className="font-bold text-slate-700 uppercase break-words leading-tight">{jobName}</p>
                                                        <p className="font-medium truncate mt-1">{e.title}</p>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <Badge variant="outline" className="text-[8px] h-4 inline-flex gap-1">
                                                            <span>{plan}m</span>
                                                            <span className="text-slate-300">/</span>
                                                            <span className={real > plan ? "text-red-600 font-bold" : "text-slate-600"}>{real}m</span>
                                                        </Badge>
                                                    </div>

                                                    {!readOnly && (
                                                        <div className="flex items-center justify-end gap-1 w-full pt-1 border-t border-slate-100/50">
                                                            <EditDialog entry={e} allJobs={allJobs} onSave={() => router.refresh()} />
                                                            <DeleteButton entryId={e.id} />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}