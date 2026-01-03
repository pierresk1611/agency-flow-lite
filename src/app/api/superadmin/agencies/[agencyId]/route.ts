import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { agencyId: string } }) {
    const session = await getSession()
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const agency = await prisma.agency.findUnique({
            where: { id: params.agencyId },
            include: {
                _count: {
                    select: { users: true, clients: true }
                }
            }
        })

        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        return NextResponse.json(agency)
    } catch (error) {
        console.error('Agency detail error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
