// app/[slug]/timesheets/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle, BellRing } from 'lucide-react'
import { TimesheetActions } from '@/components/timesheet-actions'
import { NudgeButton } from '@/components/nudge-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export default async function TimesheetsPage({ params }: { params: { slug: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  const timesheets = await prisma.timesheet.findMany({
    where: {
      jobAssignment: {
        userId: isCreative ? session.userId : undefined,
        job: { campaign: { client: { agencyId: agency.id } } }
      }
    },
    orderBy: [
      { isUrgent: 'desc' },
      { startTime: 'desc' }
    ],
    include: {
      jobAssignment: {
        include: {
          user: true,
          job: { include: { campaign: { include: { client: true } } } }
        }
      }
    }
  })

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(session.role)
  const pendingTimesheets = timesheets.filter(t => t.status === 'PENDING')
  const archivedTimesheets = timesheets.filter(t => t.status !== 'PENDING')

  // Group archived by client
  const archivedByClient = archivedTimesheets.reduce((acc, ts) => {
    const clientName = ts.jobAssignment.job?.campaign?.client?.name || 'Interné / Ostatné'
    if (!acc[clientName]) acc[clientName] = []
    acc[clientName].push(ts)
    return acc
  }, {} as Record<string, typeof archivedTimesheets>)

  const sortedClients = Object.keys(archivedByClient).sort()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">
            {isCreative ? 'Moje výkazy' : 'Schvaľovanie práce'}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            {isCreative ? 'Prehľad vašej odpracovanej práce.' : `Prehľad k schváleniu pre agentúru ${agency.name}.`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="pending" className="relative pr-8">
            Na schválenie
            {pendingTimesheets.length > 0 && (
              <Badge variant="destructive" className="absolute right-1 top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {pendingTimesheets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive">Archív ({archivedTimesheets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Čaká na spracovanie</span>
          </div>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <TimesheetTable
                data={pendingTimesheets}
                isCreative={isCreative}
                isAdmin={isAdmin}
                showActions={!isCreative}
                emptyMessage="Všetko vybavené. Žiadne čakačky."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="archive" className="space-y-10">
          {sortedClients.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-slate-50/50">
              <p className="text-slate-400 italic text-sm font-medium">Žiadna história k zobrazeniu.</p>
            </div>
          ) : (
            sortedClients.map(clientName => (
              <div key={clientName} className="space-y-3">
                <div className="flex items-center gap-2 pl-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{clientName}</h3>
                </div>
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden opacity-95 hover:opacity-100 transition-opacity">
                  <div className="overflow-x-auto w-full">
                    <TimesheetTable
                      data={archivedByClient[clientName]}
                      isCreative={isCreative}
                      isAdmin={isAdmin}
                      showActions={false}
                      emptyMessage="Žiadne záznamy pre tohto klienta."
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TimesheetTable({ data, isCreative, isAdmin, showActions, emptyMessage }: any) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader className="bg-slate-50/50 text-[10px] font-black uppercase border-b">
        <TableRow>
          <TableHead className="pl-6 h-10">Kedy / Kto</TableHead>
          <TableHead>Projekt / Task</TableHead>
          <TableHead>Trvanie</TableHead>
          {isAdmin && <TableHead className="text-right">Náklad</TableHead>}
          {isAdmin && <TableHead className="text-right">Fakturácia</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="text-right pr-6">Akcia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isAdmin ? 7 : 5} className="h-24 text-center text-muted-foreground italic text-sm">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((ts: any) => {
            const isRunning = ts.endTime === null
            const hours = (ts.durationMinutes || 0) / 60
            const cost = hours * (ts.jobAssignment.user?.costRate || 0)
            const billable = hours * (ts.jobAssignment.user?.hourlyRate || 0)

            return (
              <TableRow
                key={ts.id}
                className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  ts.isUrgent && ts.status === 'PENDING' ? "bg-red-50/30" : ""
                )}
              >
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold text-slate-900 text-sm tracking-tight">{format(new Date(ts.startTime), 'dd.MM.yyyy')}</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {ts.jobAssignment.user?.name || ts.jobAssignment.user?.email?.split('@')[0] || 'N/A'}
                    </span>
                    {ts.description && <p className="text-[10px] text-slate-500 font-medium italic mt-1 line-clamp-1 max-w-[200px]" title={ts.description}>"{ts.description}"</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{ts.jobAssignment.job?.title || 'N/A'}</span>
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mt-0.5">
                      {ts.jobAssignment.job?.campaign?.name || 'Bez kampane'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {isRunning ? (
                    <Badge variant="outline" className="animate-pulse bg-blue-50 border-blue-200 text-blue-700 font-black text-[9px] uppercase">BEŽÍ...</Badge>
                  ) : (
                    <span className="font-mono text-xs font-black text-slate-700 tracking-tighter">
                      {Math.floor((ts.durationMinutes || 0) / 60)}h {(ts.durationMinutes || 0) % 60}m
                    </span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right font-mono text-xs text-slate-400">
                    {cost.toFixed(2)}€
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell className="text-right font-mono text-xs font-black text-slate-900">
                    {billable.toFixed(2)}€
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {ts.status === 'APPROVED' && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Schválené
                      </Badge>
                    )}
                    {ts.status === 'REJECTED' && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-black uppercase">
                        <XCircle className="h-2.5 w-2.5 mr-1" /> Zamietnuté
                      </Badge>
                    )}
                    {ts.status === 'PENDING' && !isRunning && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-black uppercase",
                          ts.isUrgent ? "bg-red-600 text-white border-none animate-pulse" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {ts.isUrgent ? <BellRing className="h-2.5 w-2.5 mr-1" /> : <AlertCircle className="h-2.5 w-2.5 mr-1" />}
                        {ts.isUrgent ? 'URGENTNÉ' : 'ČAKÁ'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end items-center gap-2">
                    {isCreative && ts.status === 'PENDING' && !isRunning && !ts.isUrgent && (
                      <NudgeButton timesheetId={ts.id} />
                    )}
                    {showActions && !isRunning && ts.status === 'PENDING' && (
                      <TimesheetActions id={ts.id} status={ts.status} isRunning={isRunning} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
