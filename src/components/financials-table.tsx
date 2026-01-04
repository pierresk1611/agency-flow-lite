'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, Download, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type FinancialJob = {
    id: string
    jobTitle: string
    clientName: string
    clientId: string
    campaignName: string
    campaignId: string
    deadline: Date
    status: string
    plannedBudget: number
    actualCost: number
    difference: number
    profitability: number
    totalHours: number
    isOverBudget: boolean
    hasData: boolean
}

type Summary = {
    totalPlanned: number
    totalActual: number
    totalDifference: number
    totalHours: number
    jobCount: number
    overBudgetCount: number
    underBudgetCount: number
}

type SortField = 'jobTitle' | 'clientName' | 'plannedBudget' | 'actualCost' | 'difference' | 'profitability' | 'deadline'
type SortDirection = 'asc' | 'desc'

export function FinancialsTable({
    initialJobs,
    initialSummary,
    slug
}: {
    initialJobs: FinancialJob[]
    initialSummary: Summary
    slug: string
}) {
    const router = useRouter()
    const [jobs, setJobs] = useState<FinancialJob[]>(initialJobs)
    const [filteredJobs, setFilteredJobs] = useState<FinancialJob[]>(initialJobs)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<SortField>('deadline')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [filterStatus, setFilterStatus] = useState<'all' | 'over' | 'under'>('all')

    // Filter and sort jobs
    useEffect(() => {
        let filtered = [...jobs]

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Apply status filter
        if (filterStatus === 'over') {
            filtered = filtered.filter(job => job.isOverBudget)
        } else if (filterStatus === 'under') {
            filtered = filtered.filter(job => !job.isOverBudget && job.plannedBudget > 0)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal: any = a[sortField]
            let bVal: any = b[sortField]

            if (sortField === 'deadline') {
                aVal = new Date(aVal).getTime()
                bVal = new Date(bVal).getTime()
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        })

        setFilteredJobs(filtered)
    }, [jobs, searchTerm, sortField, sortDirection, filterStatus])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const exportToCSV = () => {
        const headers = ['Klient', 'Kampaň', 'Job', 'Deadline', 'Plán (€)', 'Realita (€)', 'Rozdiel (€)', 'Ziskovosť (%)', 'Hodiny']
        const rows = filteredJobs.map(job => [
            job.clientName,
            job.campaignName,
            job.jobTitle,
            format(new Date(job.deadline), 'dd.MM.yyyy'),
            job.plannedBudget.toFixed(2),
            job.actualCost.toFixed(2),
            job.difference.toFixed(2),
            job.profitability.toFixed(2),
            job.totalHours.toFixed(2)
        ])

        const csv = [headers, ...rows].map(row => row.join(';')).join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `financny-prehlad-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
    }

    const SortButton = ({ field, label }: { field: SortField, label: string }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-bold uppercase text-[10px] tracking-wider"
        >
            {label}
            <ArrowUpDown className="h-3 w-3" />
        </button>
    )

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 text-white shadow-lg border-none">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Celkový Plán</p>
                        <div className="text-3xl font-black mt-2">{initialSummary.totalPlanned.toFixed(0)} €</div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-600 text-white shadow-lg border-none">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Skutočnosť</p>
                        <div className="text-3xl font-black mt-2">{initialSummary.totalActual.toFixed(0)} €</div>
                    </CardContent>
                </Card>

                <Card className={`${initialSummary.totalDifference >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white shadow-lg border-none`}>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Rozdiel</p>
                        <div className="text-3xl font-black mt-2 flex items-center gap-2">
                            {initialSummary.totalDifference >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                            {Math.abs(initialSummary.totalDifference).toFixed(0)} €
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-500 text-white shadow-lg border-none">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Celkové Hodiny</p>
                        <div className="text-3xl font-black mt-2">{initialSummary.totalHours.toFixed(1)} h</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('all')}
                                className="text-xs"
                            >
                                Všetky ({initialJobs.length})
                            </Button>
                            <Button
                                variant={filterStatus === 'over' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('over')}
                                className="text-xs"
                            >
                                Nad rozpočtom ({initialSummary.overBudgetCount})
                            </Button>
                            <Button
                                variant={filterStatus === 'under' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus('under')}
                                className="text-xs"
                            >
                                Pod rozpočtom ({initialSummary.underBudgetCount})
                            </Button>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Hľadať klienta, kampaň, job..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 text-sm"
                                />
                            </div>
                            <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="shadow-xl border-none ring-1 ring-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-500">
                                    <SortButton field="clientName" label="Klient" />
                                </th>
                                <th className="px-4 py-3 text-left text-slate-500">
                                    <SortButton field="jobTitle" label="Job" />
                                </th>
                                <th className="px-4 py-3 text-left text-slate-500">
                                    <SortButton field="deadline" label="Deadline" />
                                </th>
                                <th className="px-4 py-3 text-right text-slate-500">
                                    <SortButton field="plannedBudget" label="Plán" />
                                </th>
                                <th className="px-4 py-3 text-right text-slate-500">
                                    <SortButton field="actualCost" label="Realita" />
                                </th>
                                <th className="px-4 py-3 text-right text-slate-500">
                                    <SortButton field="difference" label="Rozdiel" />
                                </th>
                                <th className="px-4 py-3 text-right text-slate-500">
                                    <SortButton field="profitability" label="Ziskovosť" />
                                </th>
                                <th className="px-4 py-3 text-center text-slate-500">
                                    <span className="font-bold uppercase text-[10px] tracking-wider">Status</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic text-sm">
                                        Žiadne joby zodpovedajúce filtrom.
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map(job => (
                                    <tr
                                        key={job.id}
                                        onClick={() => router.push(`/${slug}/jobs/${job.id}`)}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">{job.clientName}</div>
                                                <div className="text-xs text-slate-500">{job.campaignName}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-sm text-slate-700">{job.jobTitle}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-mono text-slate-600">
                                                {format(new Date(job.deadline), 'dd.MM.yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="font-bold text-sm text-slate-900">{job.plannedBudget.toFixed(0)} €</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="font-bold text-sm text-blue-600">{job.actualCost.toFixed(0)} €</div>
                                            <div className="text-xs text-slate-500">{job.totalHours.toFixed(1)} h</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className={`font-bold text-sm ${job.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {job.difference >= 0 ? '+' : ''}{job.difference.toFixed(0)} €
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className={`font-bold text-sm ${job.profitability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {job.profitability >= 0 ? '+' : ''}{job.profitability.toFixed(1)} %
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {job.isOverBudget ? (
                                                <Badge variant="destructive" className="text-xs">
                                                    <TrendingDown className="h-3 w-3 mr-1" />
                                                    Nad
                                                </Badge>
                                            ) : job.plannedBudget > 0 ? (
                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                    Pod
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">N/A</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Results count */}
            <div className="text-center text-sm text-slate-500">
                Zobrazených {filteredJobs.length} z {initialJobs.length} jobov
            </div>
        </div>
    )
}
