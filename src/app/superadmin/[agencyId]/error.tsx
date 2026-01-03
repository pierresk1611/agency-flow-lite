'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <h2 className="text-xl font-bold text-red-600">Nastala chyba pri načítaní detailu agentúry!</h2>
            <p className="text-slate-500">{error.message}</p>
            <div className="p-4 bg-slate-100 rounded text-xs font-mono max-w-lg overflow-auto">
                {error.stack}
            </div>
            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Skúsiť znova
            </Button>
            <Button variant="outline" onClick={() => router.refresh()}>
                Reload Stránky
            </Button>
        </div>
    )
}
