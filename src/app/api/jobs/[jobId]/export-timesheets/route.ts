import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { format } from 'date-fns'

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const jobId = params.jobId

        // STRICT AGENCY CHECK: Verify job ownership
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { campaign: { include: { client: true } } }
        })

        if (!job || job.campaign.client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        const timesheets = await prisma.timesheet.findMany({
            where: {
                jobAssignment: {
                    jobId: jobId
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
                { jobAssignment: { user: { name: 'asc' } } },
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

        const rows = timesheets.map(ts => {
            const hours = (ts.durationMinutes || 0) / 60
            const rate = ts.jobAssignment.user.hourlyRate || 0
            const cost = hours * rate

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

        const csvContent = '\uFEFF' + [headers, ...rows].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="job_timesheets_${jobId}_${format(new Date(), 'yyyyMMdd')}.csv"`,
            },
        })

    } catch (error: any) {
        console.error("JOB EXPORT ERROR:", error)
        return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 })
    }
}
