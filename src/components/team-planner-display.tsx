'use client'

import { PlannerDisplay } from './planner-display'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserPlanner {
    user: {
        id: string
        name: string | null
        position: string | null
    }
    entries: any[]
}

interface GroupedPlanners {
    category: string
    users: UserPlanner[]
}


export function TeamPlannerDisplay({ groupedPlanners, allJobs, currentUserId }: { groupedPlanners: GroupedPlanners[], allJobs: any[], currentUserId?: string }) {

    // Logic for Pinning Current User
    let pinnedUserPlanner: UserPlanner | undefined = undefined;

    // Create a deep copy or filter
    const activeGroups = groupedPlanners.map(group => {
        const usersv = group.users.filter(u => {
            if (u.user.id === currentUserId) {
                pinnedUserPlanner = u
                return false
            }
            return true
        })
        return { ...group, users: usersv }
    }).filter(group => group.users.length > 0)


    return (
        <div className="space-y-12">
            {/* PINNED USER SECTION */}
            {pinnedUserPlanner && (
                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-blue-600 border-b border-blue-200 pb-2">
                        Môj Plán
                    </h3>
                    <Card key={pinnedUserPlanner.user.id} className="border-2 border-blue-500 shadow-md ring-0 bg-blue-50/10">
                        <CardHeader className="px-4 py-2 flex flex-row items-center gap-4 bg-blue-100/50">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                                {pinnedUserPlanner.user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">{pinnedUserPlanner.user.name} <span className="text-xs text-blue-600">(Ja)</span></h4>
                                <p className="text-sm text-slate-500 font-medium uppercase">{pinnedUserPlanner.user.position || 'Nezaradený'}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            <PlannerDisplay
                                initialEntries={pinnedUserPlanner.entries}
                                allJobs={allJobs}
                                readOnly={false} // User CAN edit their own plan even in Team View
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* REST OF THE TEAM */}
            {activeGroups.map((group) => (
                <div key={group.category} className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-500 border-b pb-2">
                        {group.category}
                    </h3>

                    <div className="space-y-8">
                        {group.users.map((planner) => (
                            <Card key={planner.user.id} className="border-0 shadow-none ring-0">
                                <CardHeader className="px-0 py-2 flex flex-row items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                        {planner.user.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900">{planner.user.name}</h4>
                                        <p className="text-sm text-slate-500 font-medium uppercase">{planner.user.position || 'Nezaradený'}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-0">
                                    <PlannerDisplay
                                        initialEntries={planner.entries}
                                        allJobs={allJobs}
                                        readOnly={true}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
