'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function TrafficError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("TRAFFIC ERROR:", error)
    }, [error])

    return (
        <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4 border rounded-xl bg-red-50/50 border-red-100">
            <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Chyba v Traffic View</h2>
            <p className="text-slate-500 max-w-sm">
                Nepodarilo sa načítať dáta pre Traffic. Skontrolujte konzolu pre viac info.
            </p>
            <Button onClick={() => reset()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                Skúsiť znova
            </Button>
        </div>
    )
}
