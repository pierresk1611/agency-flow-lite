import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, addDays } from 'date-fns'
import { Users, ListChecks, CheckCircle2, Download } from "lucide-react"
import Link from 'next/link'

// Grafy
import { WorkloadChart } from "@/components/charts/workload-chart"
import { TimesheetStatusChart } from "@/components/charts/timesheet-status-chart"
import { JobStatusChart } from "@/components/charts/job-status-chart"
import { BurningTasks } from "@/components/burning-tasks"
import { BudgetVsActualChart } from "@/components/charts/budget-vs-actual-chart"
import { BarChart3 } from "lucide-react"
import { TrafficRequests } from "@/components/traffic-requests"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  try {
    // ✅ Session musí byť await
    const session = await getSession()
    if (!session) redirect('/login')

    // ✅ Získanie agency
    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) return notFound()
    if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

    const isCreative = session.role === 'CREATIVE'
    const now = new Date()
    const criticalThreshold = addDays(now, 7)

    // 1️⃣ NAČÍTANIE JOBOV
    const jobs = await prisma.job.findMany({
      where: {
        archivedAt: null,
        campaign: { client: { agencyId: agency.id } },
        assignments: isCreative ? { some: { userId: session.userId } } : undefined
      },
      include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true, timesheets: true } } }
    }) || []

    // 2️⃣ ANALYTIKA: ACTIVE, OVERDUE, WARNING
    const activeCount = jobs.filter(j => j.status !== 'DONE').length
    const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline < now)
    const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline >= now && j.deadline <= criticalThreshold)

    // 2.5️⃣ BURNING TASKS (Deadline < 5 days)
    const burningTasks = jobs.filter(j =>
      j.status !== 'DONE' &&
      j.deadline &&
      j.deadline >= now &&
      j.deadline <= addDays(now, 5)
    ).sort((a, b) => (new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()))

    // 4️⃣ TIMESHEETS
    const pendingCount = await prisma.timesheet.count({
      where: { status: 'PENDING', endTime: { not: null }, jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
    })
    const approvedCount = await prisma.timesheet.count({
      where: { status: 'APPROVED', jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
    })
    const tsData = [{ name: 'Výkazy', approved: approvedCount, pending: pendingCount }]

    // 5️⃣ WORKLOAD (ADMIN only) - Planned Hours for next 7 days
    let workloadData: { name: string, value: number }[] = []
    if (!isCreative) {
      const next7Days = addDays(new Date(), 7)
      const users = await prisma.user.findMany({
        where: { agencyId: agency.id, active: true },
        include: {
          plannerEntries: {
            where: {
              date: {
                gte: new Date(),
                lte: next7Days
              }
            }
          }
        }
      })

      workloadData = users.map(u => ({
        name: u.name || u.email.split('@')[0],
        value: Math.round((u.plannerEntries.reduce((sum, entry) => sum + entry.minutes, 0) / 60) * 10) / 10 // Convert to hours, 1 decimal
      })).filter(v => v.value > 0).sort((a, b) => b.value - a.value)
    }

    // 6️⃣ JOB STATUS
    const statusCounts = {
      TODO: jobs.filter(j => j.status === 'TODO').length,
      IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
      DONE: jobs.filter(j => j.status === 'DONE').length
    }
    const jobStatusData = [
      { name: 'TODO', value: statusCounts.TODO },
      { name: 'IN_PROGRESS', value: statusCounts.IN_PROGRESS },
      { name: 'DONE', value: statusCounts.DONE }
    ]

    // 7️⃣ TEAM COUNT
    const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

    // 8️⃣ CREATIVE TIME DATA
    let creativeTimeData: { name: string, minutes: number }[] = []
    if (isCreative) {
      const myTs = await prisma.timesheet.findMany({
        where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
        orderBy: { startTime: 'asc' },
        take: 10
      })
      creativeTimeData = myTs.map(t => ({
        name: t.startTime ? format(new Date(t.startTime), 'd.M.') : '—',
        minutes: t.durationMinutes || 0
      }))
    }

    // 9️⃣ JOB BUDGETS (Top 5)
    const budgetData = jobs
      .map(j => {
        const planned = j.budget || 0
        const spent = j.assignments.reduce((acc, assign) => {
          const rate = assign.user?.hourlyRate || 0
          const minutes = assign.timesheets.reduce((tAcc, t) => tAcc + (t.durationMinutes || 0), 0)
          return acc + (minutes / 60 * rate)
        }, 0)
        return {
          id: j.id,
          name: j.title,
          planned,
          spent: Math.round(spent)
        }
      })
      .sort((a, b) => Math.max(b.planned, b.spent) - Math.max(a.planned, a.spent))
      .slice(0, 5)

    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Manažérsky Prehľad</h2>
            <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
          </div>
          {!isCreative && (
            <Link href={`/${params.slug}/timesheets`}>
              <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </Link>
          )}
        </div>

        {!isCreative && (
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4" /> Vyťaženosť tímu (Naplánované hodiny - 7 dní)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <WorkloadChart data={workloadData} slug={params.slug} />
            </CardContent>
          </Card>
        )}

        {/* BURNING TASKS SECTION */}
        {burningTasks.length > 0 && (
          <BurningTasks tasks={burningTasks} slug={params.slug} />
        )}

        {/* BOTTOM ROW: CHARTS & COUNTERS */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 grid gap-6">
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <ListChecks className="h-4 w-4" /> Stav úloh
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <JobStatusChart data={jobStatusData} />
              </CardContent>
            </Card>

            {!isCreative && (
              <div className="grid grid-cols-1 gap-6">

                {/* 🆕 APPROVALS WIDGET (REASSIGNMENTS) */}
                <TrafficRequests />

                <Card className="shadow-xl border-none ring-1 ring-slate-200">
                  <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                      <BarChart3 className="h-4 w-4" /> Top 5 Jobov (Budget)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <BudgetVsActualChart data={budgetData} slug={params.slug} />
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-none ring-1 ring-slate-200">
                  <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                      <CheckCircle2 className="h-4 w-4" /> Schvaľovanie výkazov
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <TimesheetStatusChart data={tsData} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 grid gap-4 h-fit">
            <Link href={`/${params.slug}/jobs`} className="block transform transition hover:scale-105">
              <Card className="bg-slate-900 text-white shadow-lg border-none">
                <CardContent className="pt-4">
                  <p className="text-[10px] font-bold uppercase opacity-50">Aktívne Joby</p>
                  <div className="text-2xl font-black">{activeCount}</div>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-red-600 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                <p className="text-[10px] font-bold uppercase opacity-80">Mešká</p>
                <div className="text-2xl font-black">{overdue.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-amber-500 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                <p className="text-[10px] font-bold uppercase opacity-80">Kritické</p>
                <div className="text-2xl font-black">{warning.length}</div>
              </CardContent>
            </Card>

            <Link href={isCreative ? `/${params.slug}/timesheets` : `/${params.slug}/agency`} className="block transform transition hover:scale-105">
              <Card className="bg-blue-600 text-white shadow-lg border-none">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-bold">
                    <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {isCreative ? creativeTimeData.reduce((s, i) => s + i.minutes, 0) : teamCount}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("DASHBOARD CRITICAL ERROR:", error)
    throw error // Re-throw to show error page, but now it's logged
  }
}
