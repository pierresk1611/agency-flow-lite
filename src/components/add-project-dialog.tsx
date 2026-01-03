'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from 'lucide-react'

interface ClientOption {
    id: string
    name: string
}

export function AddProjectDialog({ clients }: { clients: ClientOption[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState('')
    const [selectedClientId, setSelectedClientId] = useState('')

    const handleCreate = async () => {
        if (!name || !selectedClientId) return
        setLoading(true)

        try {
            // Používame existujúce API pre vytváranie kampaní pod klientom
            const res = await fetch(`/api/clients/${selectedClientId}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: '' }) // Description optional
            })

            if (res.ok) {
                setOpen(false)
                setName('')
                setSelectedClientId('')
                router.refresh()
            } else {
                alert("Chyba pri vytváraní projektu.")
            }
        } catch (e) {
            console.error(e)
            alert("Nepodarilo sa vytvoriť projekt.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs h-7 gap-2">
                    <Plus className="h-3 w-3" /> Nový Projekt
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vytvoriť nový projekt</DialogTitle>
                    <DialogDescription>
                        Vyberte klienta a zadajte názov nového projektu (kampane).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Klient</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte klienta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Názov Projektu</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Napr. Rebranding 2025"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading || !name || !selectedClientId} className="bg-slate-900 text-white w-full">
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť Projekt"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
