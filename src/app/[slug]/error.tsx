'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Niečo sa pokazilo</h2>
            <p className="text-slate-500 max-w-sm">
                Vyskytla sa neočakávaná chyba pri načítaní stránky. Skúste to prosím znova.
            </p>
            <Button onClick={() => reset()} variant="outline">
                Skúsiť znova
            </Button>
        </div>
    )
}
