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

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id } = body

    if (id) {
      // Mark SINGLE as read
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
    } else {
      // Mark ALL as read (Legacy support or explicit "Mark All" button if needed)
      // User requested manual only, but good to have capability if needed, 
      // though for safety maybe restrict to ID only or keep generic.
      // Given the requirement "Remove automatic call", we primarily need the ID version.
      // Let's implement generic update for user's notifications.
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error updating notification' }, { status: 500 })
  }
}