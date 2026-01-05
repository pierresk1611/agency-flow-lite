import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let whereClause: any = {
      userId: session.userId,
      isRead: false,
      user: { agencyId: session.agencyId } // Strict agency filter
    }

    // GOD MODE: Superadmin sees all notifications in the agency
    if (session.role === 'SUPERADMIN') {
      whereClause = {
        user: { agencyId: session.agencyId },
        isRead: false
      }
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true } } },
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
      // Mark SINGLE as read - Verify ownership via agency
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!notification || notification.user.agencyId !== session.agencyId) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 })
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
    } else {
      // Mark ALL as read - Filtered by agency
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
          user: { agencyId: session.agencyId }
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error updating notification' }, { status: 500 })
  }
}