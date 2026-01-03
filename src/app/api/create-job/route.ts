import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, campaignId, externalLink } = await request.json()

    if (!title || !deadline || !campaignId) {
      return NextResponse.json({ error: 'Názov, termín a projekt sú povinné' }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        campaignId,
        status: 'TODO',
        externalLink: externalLink || null
      }
    })

    return NextResponse.json(job)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
