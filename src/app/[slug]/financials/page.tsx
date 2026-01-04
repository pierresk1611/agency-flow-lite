import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { FinancialsTable } from '@/components/financials-table'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function FinancialsPage({ params }: { params: { slug: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')

    // Only ADMIN, ACCOUNT, and SUPERADMIN can access financials
    if (!['ADMIN', 'ACCOUNT', 'SUPERADMIN'].includes(session.role)) {
        redirect(`/${params.slug}`)
    }

    const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
    if (!agency) return notFound()
    if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

    // Fetch financial data
    const jobs = await prisma.job.findMany({
        where: {
            archivedAt: null,
            campaign: {
                client: {
                    agencyId: agency.id
                }
            }
        },
        include: {
            campaign: {
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            budgets: true,
            assignments: {
                include: {
                    user: {
                        select: {
                            hourlyRate: true
                        }
                    },
                    timesheets: {
                        where: {
                            endTime: { not: null }
                        }
                    }
                }
            }
        },
        orderBy: {
            deadline: 'asc'
        }
    })

    // Calculate financial metrics for each job
    const financialData = jobs.map(job => {
        const plannedBudget = job.budget || 0

        // Calculate actual cost from budget items
        const actualCost = job.budgets.reduce((sum, budgetItem) => {
            return sum + (budgetItem.amount || 0)
        }, 0)

        // Calculate total hours worked
        const totalHours = job.budgets.reduce((sum, budgetItem) => {
            return sum + (budgetItem.hours || 0)
        }, 0)

        const difference = plannedBudget - actualCost
        const profitability = plannedBudget > 0
            ? ((difference / plannedBudget) * 100)
            : 0

        return {
            id: job.id,
            jobTitle: job.title,
            clientName: job.campaign.client.name,
            clientId: job.campaign.client.id,
            campaignName: job.campaign.name,
            campaignId: job.campaign.id,
            deadline: job.deadline,
            status: job.status,
            plannedBudget: Math.round(plannedBudget * 100) / 100,
            actualCost: Math.round(actualCost * 100) / 100,
            difference: Math.round(difference * 100) / 100,
            profitability: Math.round(profitability * 100) / 100,
            totalHours: Math.round(totalHours * 100) / 100,
            isOverBudget: actualCost > plannedBudget,
            hasData: plannedBudget > 0 || actualCost > 0
        }
    })

    // Filter out jobs without any financial data
    const filteredData = financialData.filter(job => job.hasData)

    // Calculate summary statistics
    const summary = {
        totalPlanned: filteredData.reduce((sum, job) => sum + job.plannedBudget, 0),
        totalActual: filteredData.reduce((sum, job) => sum + job.actualCost, 0),
        totalDifference: filteredData.reduce((sum, job) => sum + job.difference, 0),
        totalHours: filteredData.reduce((sum, job) => sum + job.totalHours, 0),
        jobCount: filteredData.length,
        overBudgetCount: filteredData.filter(job => job.isOverBudget).length,
        underBudgetCount: filteredData.filter(job => !job.isOverBudget && job.plannedBudget > 0).length
    }

    summary.totalPlanned = Math.round(summary.totalPlanned * 100) / 100
    summary.totalActual = Math.round(summary.totalActual * 100) / 100
    summary.totalDifference = Math.round(summary.totalDifference * 100) / 100
    summary.totalHours = Math.round(summary.totalHours * 100) / 100

    return (
        <div className="space-y-6 pb-12">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/${params.slug}`}>
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                            Finančný Prehľad
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">
                            Rozpočty a ziskovosť projektov
                        </p>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <FinancialsTable
                initialJobs={filteredData}
                initialSummary={summary}
                slug={params.slug}
            />
        </div>
    )
}
