import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Comments & Notifications...')

    // 1. Get first active agency
    const agency = await prisma.agency.findFirst({
        where: { status: 'ACTIVE' },
        include: { users: true }
    })

    if (!agency) {
        console.log('No active agency found.')
        return
    }

    const users = agency.users
    if (users.length < 2) {
        console.log('Agency needs at least 2 users for proper conversation seeding.')
    }

    // 2. Get some jobs
    const jobs = await prisma.job.findMany({
        where: { campaign: { client: { agencyId: agency.id } } },
        take: 5,
        include: { assignments: true }
    })

    for (const job of jobs) {
        console.log(`Processing Job: ${job.title}`)

        const comments = [
            "Prosím dodať podklady do zajtra.",
            "Máme potvrdený budget?",
            "Klient chce zmeniť farbu loga na 'viac dynamickú'.",
            "Hotovo, posielam na review.",
            "Super práca, díky!"
        ]

        for (const text of comments) {
            // Pick random user
            const randomUser = users[Math.floor(Math.random() * users.length)]

            await prisma.comment.create({
                data: {
                    jobId: job.id,
                    userId: randomUser.id,
                    text,
                }
            })

            // Create notifications for assigned users (except author)
            const recipients = job.assignments
                .map(a => a.userId)
                .filter(uid => uid !== randomUser.id)

            // Add admin to recipients if not assigned (optional, but good for visibility)
            // ... logic skipped for simplicity

            if (recipients.length > 0) {
                await prisma.notification.createMany({
                    data: recipients.map(uid => ({
                        userId: uid,
                        title: `Nový komentár: ${job.title}`,
                        message: `${randomUser.name || randomUser.email} pridal komentár: "${text.substring(0, 20)}..."`,
                        link: `/${agency.slug}/jobs/${job.id}`,
                        isRead: false
                    }))
                })
            }
        }
    }

    console.log('✅ Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
