import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { jobId: string } }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // STRICT AGENCY CHECK: Verify job ownership
        const job = await prisma.job.findUnique({
            where: { id: params.jobId },
            include: { campaign: { include: { client: true } } }
        })

        if (!job || job.campaign.client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        const comments = await prisma.comment.findMany({
            where: { jobId: params.jobId },
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(comments)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: { jobId: string } }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { text } = await req.json()
        if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })

        // STRICT AGENCY CHECK: Verify job ownership
        const job = await prisma.job.findUnique({
            where: { id: params.jobId },
            include: {
                campaign: { include: { client: true } },
                assignments: true
            }
        })

        if (!job || job.campaign.client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        // 1. Vytvor komentár
        const comment = await prisma.comment.create({
            data: {
                jobId: params.jobId,
                userId: session.userId,
                text
            },
            include: { user: { select: { id: true, name: true, email: true } } }
        })

        if (job) {
            // A. Assignees (okrem autora)
            const recipientIds = job.assignments
                .map(a => a.userId)
                .filter(uid => uid !== session.userId)

            // B. Global Visibility (Traffic or Admin)
            let globalRecipients: string[] = []

            // 1. Skús nájsť TRAFFIC manažérov
            const trafficUsers = await prisma.user.findMany({
                where: { agencyId: session.agencyId, role: 'TRAFFIC', active: true, id: { not: session.userId } },
                select: { id: true }
            })

            if (trafficUsers.length > 0) {
                globalRecipients = trafficUsers.map(u => u.id)
            } else {
                // 2. Ak nie je Traffic, pošli to ADMINOM
                const adminUsers = await prisma.user.findMany({
                    where: { agencyId: session.agencyId, role: 'ADMIN', active: true, id: { not: session.userId } },
                    select: { id: true }
                })
                globalRecipients = adminUsers.map(u => u.id)
            }

            const globalIds = globalRecipients

            // C. Merge & Dedup
            const uniqueRecipients = Array.from(new Set([...recipientIds, ...globalIds]))

            // 3. Vytvor notifikácie
            if (uniqueRecipients.length > 0) {
                await prisma.notification.createMany({
                    data: uniqueRecipients.map(uid => ({
                        userId: uid,
                        title: `Nový komentár: ${job.title}`,
                        message: `${session.slug || session.userId} pridal komentár: "${text.substring(0, 30)}..."`,
                        link: `/${session.slug || session.agencyId}/jobs/${params.jobId}`, // Relatívna linka
                        isRead: false
                    }))
                })
            }
        }

        return NextResponse.json(comment)

    } catch (error) {
        console.error("COMMENT ERROR:", error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
