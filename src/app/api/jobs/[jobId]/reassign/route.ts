import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function PATCH(req: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { assignmentId, targetUserId } = body
    if (!assignmentId || !targetUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Validate user role: only ADMIN/ACCOUNT/TRAFFIC/SUPERADMIN can reassign immediately
    if (!['ADMIN','ACCOUNT','TRAFFIC','SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update assignment
    const assignment = await prisma.jobAssignment.update({ where: { id: assignmentId }, data: { userId: targetUserId } })

    // Notify original and new assignee
    try {
      await createNotification(assignment.userId, 'You were assigned', `You were assigned to job ${assignment.jobId}`, `/jobs/${assignment.jobId}`)
    } catch (e) { /* ignore */ }

    return NextResponse.json({ ok: true, assignment })
  } catch (error) {
    console.error('Reassign error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
