import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Only Admin, Account, Traffic can see requests
        if (!['ADMIN', 'ACCOUNT', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const requests = await prisma.reassignmentRequest.findMany({
            where: {
                status: 'PENDING',
                assignment: {
                    job: {
                        campaign: {
                            client: {
                                agencyId: session.agencyId
                            }
                        }
                    }
                }
            },
            include: {
                requestByUser: { select: { id: true, name: true, email: true } },
                targetUser: { select: { id: true, name: true, email: true } },
                assignment: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }, // Kto ho má teraz (mal by to byť requestByUser, ale pre istotu)
                        job: {
                            select: { id: true, title: true, campaign: { select: { name: true, client: { select: { name: true } } } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(requests)

    } catch (error: any) {
        console.error("Fetch Pending Requests Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
