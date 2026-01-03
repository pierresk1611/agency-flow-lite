'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function ClientTimesheetExport({ clientId }: { clientId: string }) {
    const handleExport = () => {
        window.location.href = `/api/clients/${clientId}/export-timesheets`
    }

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-50"
        >
            <Download className="h-4 w-4" />
            Stiahnuť Timesheety (CSV)
        </Button>
    )
}
