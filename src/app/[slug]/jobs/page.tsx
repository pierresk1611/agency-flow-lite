import { prisma } from '@/lib/prisma'
import { AddJobDialog } from '@/components/add-job-dialog'
import { AddProjectDialog } from '@/components/add-project-dialog'
import { JobsTabs } from '@/components/jobs-tabs'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  // ✅ Správny await
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  // 1️⃣ ACTIVE JOBS
  const activeJobsData = await prisma.job.findMany({
    where: {
      archivedAt: null,
      status: { not: 'DONE' },
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: {
        include: {
          user: { select: { hourlyRate: true } },
          timesheets: { select: { durationMinutes: true } }
        }
      },
      budgets: true
    },
    orderBy: { deadline: 'asc' }
  })

  // 1.5️⃣ ARCHIVED JOBS
  const archivedJobsData = await prisma.job.findMany({
    where: {
      OR: [{ archivedAt: { not: null } }, { status: 'DONE' }],
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: {
        include: {
          user: { select: { hourlyRate: true } },
          timesheets: { select: { durationMinutes: true } }
        }
      },
      budgets: true
    },
    orderBy: { archivedAt: 'desc' }
  })

  // 2️⃣ CAMPAIGNS FOR DIALOG (Global Create)
  const campaigns = !isCreative ? await prisma.campaign.findMany({
    where: { client: { agencyId: agency.id }, archivedAt: null },
    select: { id: true, name: true, client: { select: { name: true } } },
    orderBy: { name: 'asc' }
  }) : []

  const campaignOptions = campaigns.map(c => ({ id: c.id, name: c.name, clientName: c.client.name }))

  // 2.5️⃣ CLIENTS FOR GLOBAL PROJECT CREATE (New Project)
  const clients = !isCreative ? await prisma.client.findMany({
    where: { agencyId: agency.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  }) : []

  // Helper to allow reuse of mapping logic
  const mapJobToItem = (j: any) => {
    const plannedBudget = j.budgets?.reduce((acc: number, b: any) => acc + b.amount, 0) || 0

    // Calculate Real Cost from timesheets
    const realCost = j.assignments.reduce((acc: number, a: any) => {
      const userRate = a.user.hourlyRate || 0
      const assignmentCost = a.timesheets.reduce((tAcc: number, t: any) => {
        const hours = (t.durationMinutes || 0) / 60
        return tAcc + (hours * userRate)
      }, 0)
      return acc + assignmentCost
    }, 0)

    return {
      id: j.id,
      title: j.title,
      campaign: j.campaign?.name || '',
      client: j.campaign?.client?.name || 'N/A',
      deadline: j.deadline,
      budget: plannedBudget,
      realCost: realCost,
      priority: j.campaign?.client?.priority || 0,
      status: j.status
    }
  }

  const activeJobs = activeJobsData.map(mapJobToItem).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  const archivedJobs = archivedJobsData.map(mapJobToItem)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {isCreative ? 'Moje Zadaniá' : 'Projekty & Tasky'}
          </h2>
        </div>
        {!isCreative && (
          <div className="flex items-center gap-2">
            <AddProjectDialog clients={clients} />
            <AddJobDialog campaigns={campaignOptions} />
          </div>
        )}
      </div>

      <JobsTabs
        activeJobs={activeJobs}
        archivedJobs={archivedJobs}
        slug={params.slug}
        isCreative={isCreative}
      />
    </div>
  )
}
