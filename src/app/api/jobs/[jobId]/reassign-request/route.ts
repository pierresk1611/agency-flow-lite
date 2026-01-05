import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { assignmentId, targetUserId, reason } = body
    if (!assignmentId || !targetUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // STRICT AGENCY CHECK: Verify assignment ownership
    const assignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: { include: { campaign: { include: { client: true } } } } }
    })

    if (!assignment || assignment.job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
    }

    // STRICT AGENCY CHECK: Verify target user ownership
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId, agencyId: session.agencyId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found or access denied' }, { status: 404 })
    }

    // Create reassignment request
    const reqRow = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        requestByUserId: session.userId,
        targetUserId,
        reason: reason || ''
      },
    })

    // Notify approvers
    const approvers = await prisma.user.findMany({
      where: { agencyId: session.agencyId, role: { in: ['ADMIN', 'ACCOUNT', 'TRAFFIC'] } }
    })
    for (const a of approvers) {
      await createNotification(a.id, 'Reassignment Request', `User ${session.userId} requested reassignment for job ${assignment.jobId}.`, `/traffic?requestId=${reqRow.id}`)
    }

    return NextResponse.json({ ok: true, request: reqRow })
  } catch (error) {
    console.error('Reassign request error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
