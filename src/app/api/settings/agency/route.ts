import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function PATCH(request: Request) {
    try {
        const session = await getSession()
        if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, address, companyId, vatId, internalAccountId } = body

        const updatedAgency = await prisma.agency.update({
            where: { id: session.agencyId },
            data: {
                name,
                address,
                companyId,
                vatId,
                internalAccountId
            }
        })

        return NextResponse.json(updatedAgency)

    } catch (error) {
        console.error("AGENCY SETTINGS ERROR:", error)
        return NextResponse.json({ error: "Server Error" }, { status: 500 })
    }
}
