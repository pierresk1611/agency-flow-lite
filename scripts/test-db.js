const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const start = Date.now()
    console.log('Connecting to database...')
    try {
        const counts = await prisma.agency.count()
        console.log(`Successfully connected! Found ${counts} agencies.`)
        console.log(`Query took ${Date.now() - start}ms`)
    } catch (e) {
        console.error('Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
