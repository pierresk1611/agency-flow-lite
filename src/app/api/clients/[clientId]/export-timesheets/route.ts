import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { format } from 'date-fns'

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const clientId = params.clientId

        // Fetch timesheets connected to this client via Campaign -> Job
        const timesheets = await prisma.timesheet.findMany({
            where: {
                jobAssignment: {
                    job: {
                        campaign: { clientId: clientId }
                    }
                }
            },
            include: {
                jobAssignment: {
                    include: {
                        user: true,
                        job: {
                            include: {
                                campaign: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { jobAssignment: { job: { campaign: { name: 'asc' } } } }, // Group by Campaign
                { jobAssignment: { job: { title: 'asc' } } },             // Group by Job
                { jobAssignment: { user: { name: 'asc' } } },             // Group by User
                { startTime: 'desc' }
            ]
        })

        // CSV Header (Semicolon separated for SK Excel)
        const headers = [
            'Kampaň',
            'Job',
            'Pracovník',
            'Dátum',
            'Hodiny',
            'Popis',
            'Sadzba (EUR/h)',
            'Suma (EUR)',
            'Status'
        ].join(';')

        // CSV Rows
        const rows = timesheets.map(ts => {
            const hours = (ts.durationMinutes || 0) / 60
            const rate = ts.jobAssignment.user.hourlyRate || 0
            const cost = hours * rate

            // Helper to format number with comma
            const fmt = (n: number) => n.toFixed(2).replace('.', ',')

            return [
                `"${ts.jobAssignment.job.campaign.name.replace(/"/g, '""')}"`,
                `"${ts.jobAssignment.job.title.replace(/"/g, '""')}"`,
                `"${ts.jobAssignment.user.name || ts.jobAssignment.user.email}"`,
                format(new Date(ts.startTime), 'yyyy-MM-dd'),
                fmt(hours),
                `"${(ts.description || '').replace(/"/g, '""')}"`,
                fmt(rate),
                fmt(cost),
                ts.status
            ].join(';')
        })

        // Add BOM for Excel UTF-8 recognition
        const csvContent = '\uFEFF' + [headers, ...rows].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="timesheets_${clientId}_${format(new Date(), 'yyyyMMdd')}.csv"`,
            },
        })

    } catch (error: any) {
        console.error("EXPORT ERROR:", error)
        return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 })
    }
}
