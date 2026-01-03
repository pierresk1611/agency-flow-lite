import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const agency = await prisma.agency.findFirst({
        where: { status: 'ACTIVE' },
        include: { users: true }
    })

    if (!agency) {
        console.log('No active agency found.')
        return
    }

    console.log(`Agency: ${agency.name} (${agency.slug})`)
    console.log('------------------------------------------------')
    console.log('Users:')
    agency.users.forEach(u => {
        console.log(`- ${u.name || 'No Name'} (${u.email}) [${u.role}]`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
