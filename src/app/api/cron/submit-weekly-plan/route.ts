import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Zabezpečenie: Overenie Cron Secret (ak je nastavený header)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new Response('Unauthorized', { status: 401 });
        // }

        // 1. Nájdi všetkých userov s PENDING timesheetmi za minulý týždeň
        // Alebo jednoduchšie: Notifikuj managerov o všetkých useroch, ktorí majú "PENDING" výkazy staršie ako 1 deň?
        // Zadanie: "v nedeľu sa automaticky odosiela na schválenie"

        // Logika: 
        // Prejdeme všetkých aktívnych userov.
        // Pre každého skontrolujeme, či má nejaké PENDING výkazy.
        // Ak áno, pošleme notifikáciu Traffic/Account managerom agentúry.

        const activeUsers = await prisma.user.findMany({
            where: { active: true, agencyId: { not: null } },
            include: { agency: true }
        })

        let notificationsSent = 0

        for (const user of activeUsers) {
            const pendingCount = await prisma.timesheet.count({
                where: {
                    jobAssignment: { userId: user.id },
                    status: 'PENDING'
                }
            })

            if (pendingCount > 0) {
                // Notifikujeme managerov
                let targetUserIds: string[] = []
                const internalAccountId = user.agency?.internalAccountId

                if (internalAccountId) {
                    targetUserIds = [internalAccountId]
                } else {
                    const managers = await prisma.user.findMany({
                        where: {
                            agencyId: user.agencyId,
                            role: { in: ['TRAFFIC', 'ADMIN', 'SUPERADMIN'] },
                            active: true
                        },
                        select: { id: true }
                    })
                    targetUserIds = managers.map(m => m.id)
                }

                if (targetUserIds.length > 0) {
                    await prisma.notification.createMany({
                        data: targetUserIds.map(managerId => ({
                            userId: managerId,
                            title: 'Týždenný uzáver',
                            message: `${user.name} má ${pendingCount} nevybavených výkazov na schválenie.`,
                            link: `/timesheets/check?userId=${user.id}`
                        }))
                    })
                    notificationsSent++
                }
            }
        }

        return NextResponse.json({ success: true, notificationsSent })

    } catch (error: any) {
        console.error("CRON WEEKLY SUBMIT ERROR:", error)
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
    }
}
