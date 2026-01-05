'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Plus, UserPlus, KeyRound, Pencil, Trash2 } from "lucide-react"

// Preddefinované oddelenia a pozície (podľa požiadavky)
const STANDARD_POSITIONS: Record<string, string[]> = {
    "Vedenie agentúry (Management)": [
        "Managing Director / CEO", "Executive Director", "Operations Director", "Finance Director / CFO"
    ],
    "Client Service / Account": [
        "Account Executive / Junior Account", "Account Manager", "Senior Account Manager",
        "Account Director", "Group Account Director", "Traffic Manager"
    ],
    "Strategy / Planning": [
        "Strategic Planner", "Digital Strategist", "Media Strategist", "Brand Strategist"
    ],
    "Creative": [
        "Creative Director (CD)", "Associate Creative Director (ACD)", "Art Director (AD)",
        "Copywriter", "Senior / Junior Copywriter", "Graphic Designer / Visual Designer",
        "Motion Designer", "Content Creator"
    ],
    "Digital / Performance / Media": [
        "PPC Specialist", "Performance Marketing Manager", "Media Buyer", "SEO Specialist",
        "Social Media Manager", "Community Manager", "CRM / Marketing Automation Specialist",
        "Data / Analytics Specialist"
    ],
    "Production / Delivery": [
        "Producer", "Digital Producer", "Project Manager", "Traffic Manager"
    ],
    "Tech / Development": [
        "Frontend Developer", "Backend Developer", "Full-stack Developer", "UX Designer",
        "UI Designer", "UX Researcher", "QA / Tester", "Tech Lead"
    ],
    "Podporné oddelenia": [
        "HR Manager / People Partner", "Office Manager", "Finance / Accounting",
        "Legal / Compliance", "IT Support"
    ]
}

const DEPARTMENTS = Object.keys(STANDARD_POSITIONS).concat("Ostatné")

const ROLES = [
    { value: 'CREATIVE', label: 'Creative (Základný prístup)' },
    { value: 'ACCOUNT', label: 'Account (Klienti & Joby)' },
    { value: 'TRAFFIC', label: 'Traffic (Plánovanie)' },
    { value: 'ADMIN', label: 'Admin (Plný prístup)' },
    { value: 'SUPERADMIN', label: 'Superadmin' },
]

export function UsersSettings({ agencyId, initialUsers, initialPositions, currentRole }: { agencyId: string, initialUsers: any[], initialPositions: any[], currentRole: string }) {
    const isSuperAdmin = currentRole === 'SUPERADMIN'
    const availableRoles = isSuperAdmin ? ROLES : ROLES.filter(r => r.value !== 'SUPERADMIN')
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [positions, setPositions] = useState(initialPositions)

    // ================= STATE PRE ADD USER DIALOG =================
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newName, setNewName] = useState('')
    const [newRole, setNewRole] = useState('CREATIVE')

    // Position Logic (Add)
    const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[1]) // Default Client Service
    const [selectedPosition, setSelectedPosition] = useState('')
    const [isCustomPosition, setIsCustomPosition] = useState(false)
    const [customPositionName, setCustomPositionName] = useState('')

    // ================= STATE PRE EDIT USER DIALOG =================
    const [editingUser, setEditingUser] = useState<any>(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRole, setEditRole] = useState('')

    // Position Logic (Edit)
    const [editDept, setEditDept] = useState('')
    const [editPosition, setEditPosition] = useState('')
    const [isEditCustomPosition, setIsEditCustomPosition] = useState(false)
    const [editCustomPositionName, setEditCustomPositionName] = useState('')

    // ================= STATE PRE DELETE =================
    const [deletingUser, setDeletingUser] = useState<any>(null)

    // ================= STATE PRE PASSWORD RESET =================
    const [resetUserId, setResetUserId] = useState<string | null>(null)
    const [resetPassword, setResetPassword] = useState('')

    // --- HELPERS ---
    const getAvailablePositionsForDept = (dept: string) => {
        const dbPositions = positions.filter((p: any) => p.category === dept).map((p: any) => p.name)
        const stdPositions = STANDARD_POSITIONS[dept] || []
        return Array.from(new Set([...dbPositions, ...stdPositions])).sort()
    }

    // Add User Dropdown Options
    const addPositionOptions = getAvailablePositionsForDept(selectedDept)

    // Edit User Dropdown Options
    const editPositionOptions = getAvailablePositionsForDept(editDept)


    // --- HANDLERS ---

    const handleCreateUser = async () => {
        if (!newUserEmail || !newUserPassword || !newName) return alert("Vyplňte všetky povinné polia.")
        const finalPositionName = isCustomPosition ? customPositionName : selectedPosition
        if (!finalPositionName) return alert("Vyberte alebo zadajte pozíciu.")

        // Logic: Create position if entirely new
        const existsInDb = positions.some((p: any) => p.name === finalPositionName && p.category === selectedDept)
        const shouldCreatePosition = isCustomPosition || !existsInDb

        setLoading(true)
        try {
            const res = await fetch('/api/settings/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    name: newName,
                    role: newRole,
                    department: selectedDept,
                    positionName: finalPositionName,
                    isNewPosition: shouldCreatePosition
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Chyba pri vytváraní")

            alert("Užívateľ vytvorený!")
            setIsAddUserOpen(false)
            setNewUserEmail(''); setNewUserPassword(''); setNewName(''); setCustomPositionName(''); setIsCustomPosition(false); setSelectedPosition('');
            router.refresh()
        } catch (error: any) { alert(error.message) } finally { setLoading(false) }
    }

    const openEditDialog = (user: any, currentCategory: string) => {
        setEditingUser(user)
        setEditName(user.name || '')
        setEditEmail(user.email || '')
        setEditRole(user.role)
        setEditDept(currentCategory)
        setEditPosition(user.position || '')
        setIsEditCustomPosition(false)
        setEditCustomPositionName('')
    }

    const handleUpdateUser = async () => {
        if (!editName || !editEmail) return alert("Vyplňte povinné polia.")
        const finalPositionName = isEditCustomPosition ? editCustomPositionName : editPosition
        if (!finalPositionName) return alert("Vyberte alebo zadajte pozíciu.")

        const existsInDb = positions.some((p: any) => p.name === finalPositionName && p.category === editDept)
        const shouldCreatePosition = isEditCustomPosition || !existsInDb

        setLoading(true)
        try {
            const res = await fetch('/api/settings/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_DETAILS',
                    userId: editingUser.id,
                    name: editName,
                    email: editEmail,
                    role: editRole,
                    department: editDept,
                    positionName: finalPositionName,
                    isNewPosition: shouldCreatePosition
                })
            })
            if (!res.ok) throw new Error("Chyba pri úprave")

            setEditingUser(null)
            router.refresh()
        } catch (e: any) { alert(e.message) } finally { setLoading(false) }
    }

    const handleDeleteUser = async () => {
        if (!deletingUser) return
        setLoading(true)
        try {
            const res = await fetch('/api/settings/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deletingUser.id })
            })
            if (!res.ok) throw new Error("Chyba pri mazaní")
            setDeletingUser(null)
            router.refresh()
        } catch (e) { alert("Chyba.") } finally { setLoading(false) }
    }

    const handleResetPassword = async () => {
        // ... (existing code logic)
        if (!resetPassword) return
        setLoading(true)
        try {
            const res = await fetch('/api/settings/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'RESET_PASSWORD', userId: resetUserId, newPassword: resetPassword })
            })
            if (!res.ok) throw new Error("Chyba")
            alert("Heslo zmenené.")
            setResetUserId(null); setResetPassword('');
        } catch (e) { alert("Chyba.") } finally { setLoading(false) }
    }

    // ================= RENDER LOGIC =================
    const getCategoryForUser = (userPos: string) => {
        const found = positions.find((p: any) => p.name === userPos)
        if (!found) {
            for (const [dept, positionsList] of Object.entries(STANDARD_POSITIONS)) {
                if (positionsList.includes(userPos)) return dept
            }
        }
        return found?.category || "Ostatné"
    }

    const groupedUsers = new Map<string, any[]>()
    DEPARTMENTS.forEach(d => groupedUsers.set(d, []))

    initialUsers.forEach(u => {
        const cat = getCategoryForUser(u.position || '')
        if (groupedUsers.has(cat)) groupedUsers.get(cat)?.push(u)
        else {
            if (!groupedUsers.has("Ostatné")) groupedUsers.set("Ostatné", [])
            groupedUsers.get("Ostatné")?.push(u)
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <UserPlus className="mr-2 h-4 w-4" /> Pridať člena tímu
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>Nový užívateľ</DialogTitle></DialogHeader>
                        {/* ADD USER FORM */}
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Meno a Priezvisko</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Email</Label><Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Heslo</Label><Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Rola</Label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{availableRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="grid gap-2">
                                <Label>Oddelenie</Label>
                                <Select value={selectedDept} onValueChange={val => { setSelectedDept(val); setSelectedPosition(''); }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Pozícia</Label>
                                {!isCustomPosition ? (
                                    <div className="flex gap-2">
                                        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Vyberte pozíciu" /></SelectTrigger>
                                            <SelectContent>
                                                {addPositionOptions.map(pName => <SelectItem key={pName} value={pName}>{pName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" onClick={() => setIsCustomPosition(true)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input placeholder="Názov novej pozície" value={customPositionName} onChange={e => setCustomPositionName(e.target.value)} />
                                        <Button variant="ghost" onClick={() => setIsCustomPosition(false)}>Zrušiť</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateUser} disabled={loading} className="bg-slate-900 text-white w-full">Vytvoriť užívateľa</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from(groupedUsers.entries()).map(([dept, users]) => {
                    if (users.length === 0) return null
                    return (
                        <Card key={dept} className="bg-slate-50/50">
                            <CardHeader className="py-3 border-b bg-white">
                                <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">
                                    {dept} <Badge variant="secondary" className="ml-2">{users.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <div key={u.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition group">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{u.name}</p>
                                                <div className="flex gap-2 text-xs text-slate-500">
                                                    <span>{u.position || 'Bez pozície'}</span>
                                                    <span>•</span>
                                                    <span>{u.email}</span>
                                                    <span>•</span>
                                                    <span className="uppercase text-[10px] font-black bg-slate-100 px-1 rounded">{u.role}</span>
                                                </div>
                                            </div>

                                            {(!u.role || u.role !== 'SUPERADMIN' || isSuperAdmin) && (
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(u, dept)} title="Upraviť detaily">
                                                        <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setResetUserId(u.id)} title="Zmeniť heslo">
                                                        <KeyRound className="h-4 w-4 text-slate-400 hover:text-amber-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setDeletingUser(u)} title="Odstrániť (Deaktivovať)">
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* EDIT USER DIALOG */}
            <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Upraviť užívateľa</DialogTitle></DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Meno</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Email</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
                            </div>
                            <div className="grid gap-2"><Label>Rola</Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{availableRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <hr className="my-2" />
                            <div className="grid gap-2">
                                <Label>Oddelenie</Label>
                                <Select value={editDept} onValueChange={val => { setEditDept(val); setEditPosition(''); }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Pozícia</Label>
                                {!isEditCustomPosition ? (
                                    <div className="flex gap-2">
                                        <Select value={editPosition} onValueChange={setEditPosition}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Vyberte pozíciu" /></SelectTrigger>
                                            <SelectContent>
                                                {editPositionOptions.map(pName => <SelectItem key={pName} value={pName}>{pName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" onClick={() => setIsEditCustomPosition(true)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input placeholder="Názov novej pozície" value={editCustomPositionName} onChange={e => setEditCustomPositionName(e.target.value)} />
                                        <Button variant="ghost" onClick={() => setIsEditCustomPosition(false)}>Zrušiť</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleUpdateUser} disabled={loading}>Uložiť zmeny</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM DIALOG */}
            <Dialog open={!!deletingUser} onOpenChange={(o) => !o && setDeletingUser(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Odstrániť užívateľa?</DialogTitle></DialogHeader>
                    <DialogDescription>
                        Naozaj chcete deaktivovať užívateľa <b>{deletingUser?.name}</b>?
                        Užívateľ sa nebude môcť prihlásiť, ale jeho história ostane zachovaná.
                    </DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingUser(null)}>Zrušiť</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Odstrániť"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RESET PASSWORD DIALOG */}
            <Dialog open={!!resetUserId} onOpenChange={(o) => !o && setResetUserId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Zmeniť heslo</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <Label>Nové heslo</Label>
                        <Input value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleResetPassword} disabled={!resetPassword || loading}>Uložiť nové heslo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
