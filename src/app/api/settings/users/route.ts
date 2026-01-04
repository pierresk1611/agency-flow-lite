import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import * as bcrypt from "bcryptjs"

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { email, password, name, role, department, positionName, isNewPosition } = body

        // 1. Create Position if new
        if (isNewPosition) {
            await prisma.agencyPosition.create({
                data: {
                    agencyId: session.agencyId!,
                    name: positionName,
                    category: department
                }
            }).catch(() => { /* Ignore unique constraint error if exists */ })
        }

        // 2. Hash Password
        const passwordHash = await bcrypt.hash(password, 10)

        // 3. Create User
        const newUser = await prisma.user.create({
            data: {
                agencyId: session.agencyId!,
                email,
                passwordHash,
                name,
                role,
                position: positionName,
                hourlyRate: 0 // Default
            }
        })

        return NextResponse.json(newUser)

    } catch (error: any) {
        console.error("CREATE USER ERROR:", error)
        // Handle unique constraint violation for email
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Užívateľ s týmto emailom už existuje." }, { status: 400 })
        }
        return NextResponse.json({ error: "Server Error" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { action, userId, newPassword } = body

        if (action === 'RESET_PASSWORD') {
            const passwordHash = await bcrypt.hash(newPassword, 10)
            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash }
            })
            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_DETAILS') {
            const { name, email, role, department, positionName, isNewPosition } = body

            // 1. Create Position if new (Check Logic same as POST)
            if (isNewPosition) {
                await prisma.agencyPosition.create({
                    data: {
                        agencyId: session.agencyId!,
                        name: positionName,
                        category: department
                    }
                }).catch(() => { })
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    name,
                    email,
                    role,
                    position: positionName
                }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("USER PATCH ERROR:", error)
        return NextResponse.json({ error: "Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { userId } = body

        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

        // Soft Delete (Deactivate)
        await prisma.user.update({
            where: { id: userId },
            data: { active: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("USER DELETE ERROR:", error)
        return NextResponse.json({ error: "Server Error" }, { status: 500 })
    }
}
