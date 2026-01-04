'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface AgencySettingsFormProps {
    agency: any
    allUsers: any[]
}

export function AgencySettingsForm({ agency, allUsers }: AgencySettingsFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form state
    const [name, setName] = useState(agency.name || '')
    const [address, setAddress] = useState(agency.address || '')
    const [companyId, setCompanyId] = useState(agency.companyId || '')
    const [vatId, setVatId] = useState(agency.vatId || '')
    const [internalAccountId, setInternalAccountId] = useState(agency.internalAccountId || 'NO_ONE')

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/settings/agency`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    address,
                    companyId,
                    vatId,
                    internalAccountId: internalAccountId === 'NO_ONE' ? null : internalAccountId
                })
            })

            if (!res.ok) throw new Error("Chyba pri ukladaní")

            router.refresh()
            alert("Nastavenia uložené.")
        } catch (error) {
            console.error(error)
            alert("Nepodarilo sa uložiť nastavenia.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="grid gap-2">
                <Label>Názov Agentúry</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>IČO</Label>
                    <Input value={companyId} onChange={e => setCompanyId(e.target.value)} placeholder="12345678" />
                </div>
                <div className="grid gap-2">
                    <Label>DIČ / IČ DPH</Label>
                    <Input value={vatId} onChange={e => setVatId(e.target.value)} placeholder="SK1234567890" />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Adresa</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ulica, Mesto, PSČ" />
            </div>

            <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                <div className="grid gap-2">
                    <Label className="font-bold">Zodpovedný Account (Interné Joby)</Label>
                    <p className="text-xs text-slate-500 mb-2">
                        Táto osoba bude dostávať notifikácie na schvaľovanie interných výkazov (napr. dovolenky, porady).
                        Ak nie je vybraný nikto, notifikácie dostanú všetci Traffic manažéri.
                    </p>
                    <Select value={internalAccountId || 'NO_ONE'} onValueChange={setInternalAccountId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Vyberte osobu..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NO_ONE">-- Nikto (Všetci Traffic manažéri) --</SelectItem>
                            {allUsers.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Uložiť Zmeny
            </Button>
        </div>
    )
}
