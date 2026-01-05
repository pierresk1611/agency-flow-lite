import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    // 1. Načítanie session
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.userId

    // 2. Načítanie dát z requestu
    const { jobId, text } = await request.json()
    if (!jobId || !text) {
      return NextResponse.json({ error: 'Chýba text alebo ID jobu' }, { status: 400 })
    }

    // 3. STRICT AGENCY CHECK: Verify job ownership
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { campaign: { include: { client: true } } }
    })

    if (!job || job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
    }

    console.log(`Ukladám komentár: User=${userId}, Job=${jobId}, Text=${text}`)

    // 4. Vytvorenie komentára
    const comment = await prisma.comment.create({
      data: {
        jobId,
        userId,
        text
      },
      include: { user: true } // vrátime meno autora
    })

    return NextResponse.json(comment)

  } catch (error: any) {
    console.error('Comment error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
