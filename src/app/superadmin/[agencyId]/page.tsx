'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, LogIn, KeyRound, Loader2, ShieldCheck, Calendar, Infinity as InfinityIcon, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface User {
    id: string; email: string; role: string; active: boolean;
}

interface AgencyDetail {
    id: string; name: string; slug: string; status: string;
    trialEndsAt: string | null; isSuspended: boolean;
    _count: { users: number, clients: number }
}

export default function AgencyAdminDetail({ params }: { params: { agencyId: string } }) {
    const router = useRouter()
    const [agency, setAgency] = useState<AgencyDetail | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState(false)
    const [impersonateOpen, setImpersonateOpen] = useState(false)

    // Trial Extension State
    const [extendOpen, setExtendOpen] = useState(false)
    const [days, setDays] = useState('30')
    const [permanent, setPermanent] = useState(false)
    const [extending, setExtending] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [usersRes, agencyRes] = await Promise.all([
                fetch(`/api/superadmin/agencies/${params.agencyId}/users`),
                fetch(`/api/superadmin/agencies/${params.agencyId}`)
            ])

            if (usersRes.ok) setUsers(await usersRes.json())
            if (agencyRes.ok) setAgency(await agencyRes.json())

        } catch (e) { console.error("Error:", e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData() }, [params.agencyId])

    const handleImpersonate = async () => {
        setImpersonating(true)
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agencyId: params.agencyId })
            })
            if (res.ok) {
                const data = await res.json()
                document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`
                window.location.href = `/${data.slug}`
            } else {
                const err = await res.json()
                alert(err.error || "Chyba pri vstupe")
            }
        } catch (e) { alert("Chyba spojenia") }
        finally { setImpersonating(false); setImpersonateOpen(false) }
    }

    const handleExtendTrial = async () => {
        setExtending(true)
        try {
            const res = await fetch(`/api/superadmin/agencies/${params.agencyId}/extend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days, permanent })
            })
            if (res.ok) {
                setExtendOpen(false)
                fetchData() // Refresh
            } else {
                alert("Chyba pri predlžovaní")
            }
        } catch (e) { alert("Chyba spojenia") }
        finally { setExtending(false) }
    }

    const resetPassword = async (userId: string) => {
        const newPass = prompt("Zadajte nové heslo:")
        if (!newPass) return
        await fetch(`/api/superadmin/agencies/${params.agencyId}/users`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newPassword: newPass })
        })
        alert("Heslo bolo úspešne zmenené.")
    }

    if (loading && !agency) return <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-400" /></div>

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-8">
            <div className="flex flex-col gap-6 border-b pb-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Link href="/superadmin"><Button variant="outline" size="icon" className="rounded-full shadow-sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900">{agency?.name}</h2>
                                {agency?.status === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>}
                                {agency?.status === 'ACTIVE' && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                                {agency?.status === 'REJECTED' && <Badge className="bg-red-100 text-red-800">Rejected</Badge>}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{agency?.id}</span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" /> {agency?._count.users} users
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Licencie</span>
                            {agency?.trialEndsAt ? (
                                <div className={`flex items-center gap-2 font-bold ${new Date(agency.trialEndsAt) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                                    <Calendar className="h-4 w-4" />
                                    {new Date(agency.trialEndsAt) < new Date() ? 'EXPIRED: ' : 'Trial do: '}
                                    {format(new Date(agency.trialEndsAt), 'd.M.yyyy')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 font-bold text-emerald-600">
                                    <InfinityIcon className="h-4 w-4" /> Full Version (Navždy)
                                </div>
                            )}
                        </div>

                        <Button onClick={() => setExtendOpen(true)} variant="outline" className="h-12 border-slate-300 shadow-sm font-bold">
                            Predĺžiť Trial
                        </Button>

                        <Button onClick={() => setImpersonateOpen(true)} disabled={impersonating} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-6 shadow-xl">
                            {impersonating ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                            GOD MODE
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2 uppercase font-black italic">
                            <ShieldCheck className="h-6 w-6" /> Aktivovať God Mode?
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-600">
                            Chystáte sa prihlásiť do agentúry <strong>{agency?.name}</strong> s plnými právami Superadmina. Budete vidieť všetko tak, ako keby ste boli členom tímu, ale s "Božskými" právomocami.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setImpersonateOpen(false)} disabled={impersonating}>Zrušiť</Button>
                        <Button onClick={handleImpersonate} disabled={impersonating} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                            {impersonating ? <Loader2 className="animate-spin mr-2" /> : "Vstúpiť ako Boh"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="shadow-lg border-none ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4"><CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Užívatelia v tejto agentúre</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead className="pl-6">Email</TableHead><TableHead>Prístup</TableHead><TableHead className="text-right pr-6">Akcie</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} className="hover:bg-slate-50/50">
                                    <TableCell className="pl-6 font-bold text-slate-700">{u.email}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{u.role}</Badge></TableCell>
                                    <TableCell className="text-right pr-6 py-4">
                                        <Button size="sm" variant="secondary" onClick={() => resetPassword(u.id)} className="h-9 font-bold">
                                            <KeyRound className="h-4 w-4 mr-2" /> Reset Hesla
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Predĺžiť alebo nastaviť licenciu</DialogTitle>
                        <DialogDescription>Nastavte dĺžku trialu alebo povoľte trvalý prístup.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
                            <Checkbox id="permanent" checked={permanent} onCheckedChange={(c) => setPermanent(!!c)} />
                            <label htmlFor="permanent" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                Aktivovať Full Version (Navždy)
                            </label>
                        </div>

                        {!permanent && (
                            <div className="grid gap-2">
                                <Label>Pridať počet dní k trialu</Label>
                                <Input type="number" value={days} onChange={e => setDays(e.target.value)} />
                                <p className="text-[10px] text-slate-500">Ak je trial expirovaný, dni sa pripočítajú k dnešnému dátumu.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtendOpen(false)}>Zrušiť</Button>
                        <Button onClick={handleExtendTrial} disabled={extending} className="bg-slate-900 text-white font-bold">
                            {extending ? <Loader2 className="animate-spin mr-2" /> : "Uložiť Licenciu"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}