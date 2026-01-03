'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, UserPlus, Repeat } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function JobActions({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reqLoading, setReqLoading] = useState(false)
  const [reassignLoading, setReassignLoading] = useState(false)

  const handleArchive = async () => {
    if (!confirm('Naozaj chcete archivovať tento job? Zmizne zo zoznamu aktívnych.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/archive`, { method: 'PATCH' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Chyba pri archivácii')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReassign = async () => {
    const assignmentId = prompt('Zadajte assignmentId (skontrolujte v detaile jobu):')
    if (!assignmentId) return
    const targetUserId = prompt('Zadajte ID užívateľa, ktorému žiadate priradiť job:')
    if (!targetUserId) return
    const reason = prompt('Dôvod žiadosti (voliteľné):') || ''
    setReqLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/reassign-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, targetUserId, reason })
      })
      if (res.ok) {
        alert('Žiadosť bola odoslaná na schválenie.')
      } else {
        const err = await res.json()
        alert(err.error || 'Chyba pri odosielaní žiadosti')
      }
    } catch (e) {
      console.error(e)
      alert('Chyba pri odosielaní žiadosti')
    } finally { setReqLoading(false) }
  }

  const handleReassignNow = async () => {
    if (!confirm('Týmto presuniete job bez schválenia. Pokračovať?')) return
    const assignmentId = prompt('Zadajte assignmentId (skontrolujte v detaile jobu):')
    if (!assignmentId) return
    const targetUserId = prompt('Zadajte ID užívateľa, ktorému chcete job priradiť:')
    if (!targetUserId) return
    setReassignLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, targetUserId })
      })
      if (res.ok) {
        alert('Job bol presunutý.')
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Chyba pri presune jobu')
      }
    } catch (e) {
      console.error(e)
      alert('Chyba pri presune jobu')
    } finally { setReassignLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleRequestReassign} disabled={reqLoading} className="text-slate-400 hover:text-blue-600" title="Request reassignment">
        {reqLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="sm" onClick={handleReassignNow} disabled={reassignLoading} className="text-slate-400 hover:text-amber-600" title="Reassign now">
        {reassignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleArchive} 
        disabled={loading}
        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
        title="Archivovať job"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  )
}