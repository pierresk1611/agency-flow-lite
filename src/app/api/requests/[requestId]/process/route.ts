import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request, { params }: { params: { requestId: string } }) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'ACCOUNT', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { action } = await req.json() // 'APPROVE' | 'REJECT'
        const requestId = params.requestId

        const request = await prisma.reassignmentRequest.findUnique({
            where: { id: requestId },
            include: { assignment: true }
        })

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

        if (action === 'APPROVE') {
            // 1. Update Assignment
            await prisma.jobAssignment.update({
                where: { id: request.assignmentId },
                data: { userId: request.targetUserId }
            })

            // 2. Update Request Status
            await prisma.reassignmentRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            })

            // 3. Notify Requester (Pôvodný majiteľ) & New Assignee & Creator
            await createNotification(request.requestByUserId, 'Žiadosť schválená', `Vaša žiadosť o presun jobu bola schválená.`, `/`)
            await createNotification(request.targetUserId, 'Nový Job', `Bol vám pridelený nový job (presun).`, `/jobs/${request.assignment.jobId}`)

        } else if (action === 'REJECT') {
            // 1. Update Request Status
            await prisma.reassignmentRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            })

            // 2. Notify Requester
            await createNotification(request.requestByUserId, 'Žiadosť zamietnutá', `Vaša žiadosť o presun jobu bola zamietnutá.`, `/jobs/${request.assignment.jobId}`)
        }

        // SMART CLEANUP: Mark related notifications as read for ALL managers
        // (Keď jeden vyrieši, ostatným zmizne)
        await prisma.notification.updateMany({
            where: {
                link: { contains: `requestId=${requestId}` },
                isRead: false
            },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Process Request Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
