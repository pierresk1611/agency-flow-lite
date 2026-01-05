import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT'].includes(session.role)) {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
    }

    const body = await request.json()
    const { assignmentId, newUserId } = body

    if (!assignmentId || !newUserId) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // STRICT AGENCY CHECK: Verify assignment ownership
    const existingAssignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: { include: { campaign: { include: { client: true } } } } }
    })

    if (!existingAssignment || existingAssignment.job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Priradenie neexistuje alebo prístup zamietnutý' }, { status: 404 })
    }

    // STRICT AGENCY CHECK: Verify new user ownership
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId, agencyId: session.agencyId }
    })
    if (!newUser) {
      return NextResponse.json({ error: 'Nový užívateľ nenájdený v tejto agentúre' }, { status: 404 })
    }

    // Aktualizácia priradenia
    const updated = await prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { userId: newUserId }
    })

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("REASSIGN JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba pri prehadzovaní jobu' }, { status: 500 })
  }
}
