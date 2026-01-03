import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let whereClause: any = { userId: session.userId, isRead: false }

    // GOD MODE: Superadmin vidí všetky notifikácie v agentúre
    if (session.role === 'SUPERADMIN') {
      whereClause = {
        user: { agencyId: session.agencyId },
        isRead: false
      }
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true } } }, // Aby sme videli komu patrí
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}