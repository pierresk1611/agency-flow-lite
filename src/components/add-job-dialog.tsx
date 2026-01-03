'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Link as LinkIcon } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  clientName: string
}

export function AddJobDialog({ campaignId, campaigns = [] }: { campaignId?: string; campaigns?: Campaign[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || '')

  const handleCreate = async () => {
    const finalCampaignId = campaignId || selectedCampaignId
    if (!title || !deadline || !finalCampaignId) return
    setLoading(true)

    try {
      const res = await fetch(`/api/create-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, deadline, campaignId: finalCampaignId, externalLink })
      })

      if (res.ok) {
        setOpen(false); setTitle(''); setDeadline(''); setExternalLink('');
        if (!campaignId) setSelectedCampaignId('')
        router.refresh()
      } else { alert("Chyba pri vytváraní.") }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  // Ak nemám campaignId (Global Mode), musím vybrať kampaň.
  const isGlobalMode = !campaignId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 font-bold uppercase">
          + Nový Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať Task</DialogTitle>
          <DialogDescription>
            {isGlobalMode ? 'Vyberte projekt a vytvorte úlohu.' : 'Vytvorte novú úlohu v tomto projekte.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isGlobalMode && (
            <div className="grid gap-2">
              <Label>Projekt (Kampaň)</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte projekt..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientName} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Názov Tasku</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Napr. Grafika na Facebook" />
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center gap-2"><LinkIcon className="h-3 w-3" /> Link na Asanu / ClickUp / Freelo</Label>
            <Input value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://app.asana.com/..." />
          </div>
          <div className="grid gap-2">
            <Label>Deadline</Label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !title || !deadline || (!campaignId && !selectedCampaignId)} className="bg-slate-900 text-white w-full">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Vytvoriť Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}