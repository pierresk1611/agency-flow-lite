import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only ADMIN, ACCOUNT, and SUPERADMIN can access financials
        if (!['ADMIN', 'ACCOUNT', 'SUPERADMIN'].includes(session.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const agencyId = searchParams.get('agencyId')

        if (!agencyId) {
            return NextResponse.json({ error: 'Agency ID required' }, { status: 400 })
        }

        // Verify user has access to this agency
        if (session.role !== 'SUPERADMIN' && session.agencyId !== agencyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch all jobs with financial data
        const jobs = await prisma.job.findMany({
            where: {
                archivedAt: null,
                campaign: {
                    client: {
                        agencyId: agencyId
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
                budgets: {
                    include: {
                        timesheet: {
                            include: {
                                jobAssignment: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true,
                                                email: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
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

        return NextResponse.json({
            jobs: filteredData,
            summary
        })

    } catch (error) {
        console.error('FINANCIALS API ERROR:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
