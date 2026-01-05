import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { jobId: string } }) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const jobId = params.jobId

        // STRICT AGENCY CHECK: Verify job ownership
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { campaign: { include: { client: true } } }
        })

        if (!job || job.campaign.client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        await prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'IN_PROGRESS',
                archivedAt: null
            }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("RESTORE JOB ERROR:", error)
        return NextResponse.json({ error: error.message || 'Failed to restore job' }, { status: 500 })
    }
}
