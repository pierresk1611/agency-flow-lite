import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { jobId: string } }) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const jobId = params.jobId

        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'DONE', archivedAt: new Date() } // Set to DONE and archive
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("CLOSE JOB ERROR:", error)
        return NextResponse.json({ error: error.message || 'Failed to close job' }, { status: 500 })
    }
}
