import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, campaignId, externalLink } = await request.json()

    // 1. Basic Validation
    if (!title || !deadline || !campaignId) {
      return NextResponse.json({ error: 'Názov, termín a projekt sú povinné' }, { status: 400 })
    }

    // 2. Date Validation
    const dateObj = new Date(deadline)
    if (isNaN(dateObj.getTime())) {
      console.error("INVALID DATE:", deadline)
      return NextResponse.json({ error: 'Neplatný formát dátumu' }, { status: 400 })
    }

    console.log("Creating JOB:", { title, deadline, campaignId, externalLink })

    // 3. Create Job
    const job = await prisma.job.create({
      data: {
        title,
        deadline: dateObj,
        campaignId,
        status: 'TODO',
        externalLink: externalLink || null
      }
    })

    console.log("JOB Created:", job.id)
    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR (500):", error)
    // Return detailed error for debugging
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 })
  }
}
