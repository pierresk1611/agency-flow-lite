import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, budget, status, deadline } = body

    if (!title && !budget && !status && !deadline) {
      return NextResponse.json({ error: 'Nie sú poskytnuté žiadne údaje na aktualizáciu' }, { status: 400 })
    }

    // STRICT AGENCY CHECK: Verify job ownership
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: { campaign: { include: { client: true } } }
    })

    if (!job || job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
    }

    const updated = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(status !== undefined && { status: status as any }),
        ...(deadline !== undefined && { deadline: new Date(deadline) })
      }
    })

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("JOB PATCH ERROR:", error)
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
  }
}
