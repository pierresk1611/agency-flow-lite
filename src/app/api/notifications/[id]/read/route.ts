import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const result = await prisma.notification.updateMany({
            where: {
                id: params.id,
                userId: session.userId
            },
            data: { isRead: true }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
