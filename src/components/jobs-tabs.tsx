'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowRight, Archive } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

type JobItem = {
    id: string
    title: string
    campaign: string
    client: string
    deadline: Date
    budget: number
    priority: number
    status: string
}

export function JobsTabs({ activeJobs, archivedJobs, slug, isCreative }: {
    activeJobs: JobItem[],
    archivedJobs: JobItem[],
    slug: string,
    isCreative: boolean
}) {
    // Group archived jobs by client
    const archivedByClient = archivedJobs.reduce((acc, job) => {
        if (!acc[job.client]) acc[job.client] = []
        acc[job.client].push(job)
        return acc
    }, {} as Record<string, JobItem[]>)

    // Sort clients alphabetically
    const sortedClients = Object.keys(archivedByClient).sort()

    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="active">Aktívne ({activeJobs.length})</TabsTrigger>
                <TabsTrigger value="archive">Archív ({archivedJobs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                <JobsTable items={activeJobs} slug={slug} isCreative={isCreative} />
            </TabsContent>

            <TabsContent value="archive">
                {sortedClients.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl bg-white shadow-sm">
                        <p className="text-slate-400 italic text-sm">Žiadne archivované projekty.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedClients.map(clientName => (
                            <div key={clientName} className="space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 pl-1">{clientName}</h3>
                                <JobsTable items={archivedByClient[clientName]} slug={slug} isCreative={isCreative} isArchive={true} />
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}

function JobsTable({ items, slug, isCreative, isArchive = false }: { items: JobItem[], slug: string, isCreative: boolean, isArchive?: boolean }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-10 border rounded-xl bg-white shadow-sm">
                <p className="text-slate-400 italic text-sm">
                    {isArchive ? 'Žiadne archivované projekty.' : 'Žiadne aktívne projekty.'}
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
                <Table className="min-w-[900px] md:min-w-full">
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-20 text-center text-[10px] font-bold uppercase">Prio</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Projekt</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Klient</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Termín</TableHead>
                            {!isCreative && <TableHead className="text-[10px] font-bold uppercase">Budget Plán / Real</TableHead>}
                            <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Akcia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((proj) => (
                            <TableRow key={proj.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="text-center font-bold">
                                    <span className={proj.priority >= 4 ? "text-red-600" : "text-slate-400"}>P{proj.priority}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {isArchive ? <Archive className="h-3 w-3 text-slate-400" /> : <ArrowRight className="h-3 w-3 text-blue-500" />}
                                            <span className={`font-semibold ${isArchive ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{proj.title}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase">{proj.campaign}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-slate-600">{proj.client}</TableCell>
                                <TableCell className="text-xs font-medium text-slate-700">
                                    {format(new Date(proj.deadline), 'dd.MM.yyyy')}
                                </TableCell>
                                {!isCreative && (
                                    <TableCell className="font-mono text-xs font-bold text-slate-600">
                                        <span className="text-slate-500">{proj.budget ? proj.budget.toFixed(0) : '-'} €</span>
                                        <span className="mx-1 text-slate-300">/</span>
                                        <span className={proj.realCost > (proj.budget || 0) ? "text-red-600" : "text-emerald-600"}>
                                            {proj.realCost ? proj.realCost.toFixed(0) : '0'} €
                                        </span>
                                    </TableCell>
                                )}
                                <TableCell className="text-right pr-6">
                                    <Link href={`/${slug}/jobs/${proj.id}`}>
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8">Detail</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
