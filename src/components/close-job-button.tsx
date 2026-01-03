'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function CloseJobButton({ jobId, isDone }: { jobId: string, isDone: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (isDone) return null

    const handleClose = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/jobs/${jobId}/close`, { method: 'POST' })
            if (res.ok) {
                router.refresh()
                router.push('../jobs') // Navigate back to list or stay? Let's stay for now or refresh.
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs h-7 text-green-700 bg-green-50 border-green-200 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3" />
                    Uzavrieť Job
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Uzavrieť tento job?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Job sa označí ako HOTOVÝ (DONE) a presunie sa do archívu.
                        Táto akcia sa dá vrátiť len cez administrátora.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClose} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Potvrdiť uzavretie
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
