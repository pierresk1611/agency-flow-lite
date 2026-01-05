import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // ✅ await session
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const includeJobs = searchParams.get('includeJobs') === 'true'

    // Support filtering by role
    const roleParam = searchParams.get('role')
    const roleFilter = roleParam ? { role: roleParam as any } : {}

    const users = await prisma.user.findMany({
      where: {
        agencyId: session.agencyId,
        active: true,
        ...roleFilter
      },
      orderBy: { email: 'asc' },
      include: {
        assignments: includeJobs ? {
          where: {
            job: {
              status: { not: 'DONE' },
              archivedAt: null
            }
          },
          include: {
            job: {
              include: {
                campaign: {
                  include: { client: true }
                }
              }
            }
          }
        } : false
      }
    })

    // Dotiahnutie pozícií pre určenie oddelenia (Department)
    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: session.agencyId }
    })

    // Map function
    const usersWithDept = users.map(u => {
      const pos = positions.find(p => p.name === u.position)
      return {
        ...u,
        department: pos?.category || 'Ostatné'
      }
    })

    return NextResponse.json(usersWithDept)
  } catch (error: any) {
    console.error("GET USERS ERROR:", error)
    return NextResponse.json({ error: 'Chyba pri načítaní dát: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // ✅ await session
    const session = await getSession()
    if (!session || !['ADMIN', 'SUPERADMIN', 'ACCOUNT'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, password, role, position, hourlyRate, costRate } = body

    // SECURITY: Only a SUPERADMIN can grant the SUPERADMIN role
    if (role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Nedostatočné oprávnenia pre pridelenie Superadmin role." }, { status: 403 })
    }

    if (!email || !password || !role)
      return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return NextResponse.json({ error: 'Užívateľ s týmto emailom už existuje' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        position,
        role,
        passwordHash,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        agencyId: session.agencyId,
        active: true
      }
    })

    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error("POST USERS ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
