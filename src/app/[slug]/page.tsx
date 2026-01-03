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
import { BudgetChart } from "@/components/charts/budget-chart"
import { BarChart3 } from "lucide-react"
import { TrafficRequests } from "@/components/traffic-requests"
import { NotificationCenter } from "@/components/notification-center"
import { PendingApprovals } from "@/components/pending-approvals"

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

    // 8️⃣ JOB BUDGETS (ALL PROJECTS - scrollable)
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
          plan: planned,
          real: Math.round(spent)
        }
      })
      .filter(j => j.plan > 0 || j.real > 0)
      .sort((a, b) => Math.max(b.plan, b.real) - Math.max(a.plan, a.real))

    // 9️⃣ CREATIVE TIME DATA
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

    // 10. RECENT NOTIFICATIONS (for Notification Center)
    const recentNotifications = await prisma.notification.findMany({
      where: {
        user: { agencyId: agency.id },
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { user: { select: { name: true } } }
    })

    // 11. PENDING TIMESHEETS (for Čaká na Schválenie widget)
    const pendingTimesheets = await prisma.timesheet.findMany({
      where: {
        status: 'PENDING',
        endTime: { not: null },
        jobAssignment: {
          job: {
            campaign: {
              client: { agencyId: agency.id }
            }
          }
        }
      },
      take: 5,
      orderBy: { startTime: 'desc' },
      include: {
        jobAssignment: {
          include: {
            user: { select: { name: true, email: true } },
            job: {
              include: {
                campaign: {
                  include: { client: { select: { name: true } } }
                }
              }
            }
          }
        }
      }
    })

    const pendingTimesheetsData = pendingTimesheets.map(ts => ({
      id: ts.id,
      userName: ts.jobAssignment.user?.name || ts.jobAssignment.user?.email?.split('@')[0] || 'N/A',
      jobTitle: ts.jobAssignment.job?.title || 'N/A',
      clientName: ts.jobAssignment.job?.campaign?.client?.name || 'N/A',
      duration: `${Math.floor((ts.durationMinutes || 0) / 60)}h ${(ts.durationMinutes || 0) % 60}m`
    }))

    return (
      <div className="space-y-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Manažérsky Prehľad</h2>
            <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* NOTIFICATION CENTER - TOP */}
        {!isCreative && recentNotifications.length > 0 && (
          <NotificationCenter
            notifications={recentNotifications.map(n => ({
              id: n.id,
              title: n.title,
              message: n.message,
              createdAt: n.createdAt
            }))}
          />
        )}

        {/* 4 COLORED STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/${params.slug}/jobs`} className="block transform transition hover:scale-105">
            <Card className="bg-slate-900 text-white shadow-lg border-none">
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Aktívne Joby</p>
                <div className="text-4xl font-black mt-2">{activeCount}</div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-red-600 text-white shadow-lg border-none">
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Mešká</p>
              <div className="text-4xl font-black mt-2">{overdue.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500 text-white shadow-lg border-none">
            <CardContent className="pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Kritické</p>
              <div className="text-4xl font-black mt-2">{warning.length}</div>
            </CardContent>
          </Card>

          <Link href={isCreative ? `/${params.slug}/timesheets` : `/${params.slug}/agency`} className="block transform transition hover:scale-105">
            <Card className="bg-blue-600 text-white shadow-lg border-none">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-bold tracking-wider">
                  <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-4xl font-black mt-2">
                  {isCreative ? creativeTimeData.reduce((s, i) => s + i.minutes, 0) : teamCount}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 3-COLUMN LAYOUT: Centrum Upozornení | Burning Tasks | Čaká na Schválenie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CENTRUM UPOZORNENÍ - Reassignment Requests */}
          {!isCreative && <TrafficRequests />}

          {/* BURNING TASKS */}
          <BurningTasks tasks={burningTasks} slug={params.slug} />

          {/* ČAKÁ NA SCHVÁLENIE */}
          {!isCreative && (
            <PendingApprovals timesheets={pendingTimesheetsData} slug={params.slug} />
          )}
        </div>

        {/* CHARTS SECTION */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* WORKLOAD CHART */}
          {!isCreative && workloadData.length > 0 && (
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <Users className="h-4 w-4" /> Vyťaženosť tímu (7 dní)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <WorkloadChart data={workloadData} slug={params.slug} />
              </CardContent>
            </Card>
          )}

          {/* JOB STATUS CHART */}
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
        </div>

        {/* FINANCIAL CHART - FULL WIDTH */}
        {!isCreative && (
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <BarChart3 className="h-4 w-4" /> Finančný Stav Projektov
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <BudgetChart data={budgetData} slug={params.slug} />
            </CardContent>
          </Card>
        )}

        {/* TIMESHEET STATUS */}
        {!isCreative && (
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
        )}
      </div>
    )
  } catch (error) {
    console.error("DASHBOARD CRITICAL ERROR:", error)
    throw error
  }
}
