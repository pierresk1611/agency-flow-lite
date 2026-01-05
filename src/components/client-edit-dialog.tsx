'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Pencil } from 'lucide-react'

interface Client {
    id: string
    name: string
    companyId?: string | null
    vatId?: string | null
    billingAddress?: string | null
    importantNote?: string | null
}

export function ClientEditDialog({ client, trigger }: { client: Client, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: 'PATCH',
                body: JSON.stringify(Object.fromEntries(formData)),
            })
            if (!res.ok) throw new Error()
            toast.success("Klient bol upravený")
            setOpen(false)
            router.refresh()
        } catch {
            toast.error("Chyba pri ukladaní")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" /> Upraviť</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upraviť klienta: {client.name}</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Názov / Meno</Label>
                        <Input name="name" defaultValue={client.name} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>IČO</Label>
                            <Input name="companyId" defaultValue={client.companyId || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label>DIČ / IČ DPH</Label>
                            <Input name="vatId" defaultValue={client.vatId || ''} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Fakturačná adresa</Label>
                        <Textarea name="billingAddress" defaultValue={client.billingAddress || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label>Interná poznámka (zobrazí sa ako Alert)</Label>
                        <Textarea name="importantNote" defaultValue={client.importantNote || ''} className="border-amber-200" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Uložiť zmeny</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
