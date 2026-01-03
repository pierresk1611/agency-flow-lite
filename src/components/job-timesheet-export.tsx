'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function JobTimesheetExport({ jobId }: { jobId: string }) {
    const handleExport = () => {
        window.location.href = `/api/jobs/${jobId}/export-timesheets`
    }

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-7"
            title="Stiahnuť timesheety jobu"
        >
            <Download className="h-3 w-3" />
            Stiahnuť timesheety
        </Button>
    )
}
