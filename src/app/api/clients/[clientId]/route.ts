import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { clientId: string } }) {
    try {
        const session = await getSession()
        if (!session) return new Response("Unauthorized", { status: 401 })

        const json = await req.json()
        const { name, companyId, vatId, billingAddress, importantNote } = json

        const updated = await prisma.client.update({
            where: { id: params.clientId },
            data: {
                name,
                companyId,
                vatId,
                billingAddress,
                importantNote
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('CLIENT_PATCH_ERROR:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}
