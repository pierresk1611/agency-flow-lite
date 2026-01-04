'use client'

import { Button } from '@/components/ui/button'
import { Building, Users, Inbox, Home } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

interface SuperAdminNavProps {
    pendingRequestsCount: number
}

export function SuperAdminNav({ pendingRequestsCount }: SuperAdminNavProps) {
    const router = useRouter()
    const pathname = usePathname()

    const navItems = [
        { label: 'Domov', icon: Home, path: '/superadmin', exact: true },
        { label: 'Agentúry', icon: Building, path: '/superadmin/agencies', exact: false },
        { label: 'Žiadosti', icon: Users, path: '/superadmin/requests', exact: false, badge: pendingRequestsCount },
        { label: 'Emailové Šablóny', icon: Inbox, path: '/superadmin/emails', exact: false },
    ]

    return (
        <div className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all">
            {navItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.path
                    : pathname.startsWith(item.path)

                return (
                    <Button
                        key={item.path}
                        variant={isActive ? "default" : "outline"}
                        className={`h-11 font-bold transition-all relative ${isActive
                                ? "bg-slate-900 text-white shadow-md scale-105"
                                : "border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                        onClick={() => router.push(item.path)}
                    >
                        <item.icon className={`h-4 w-4 mr-2 ${isActive ? "text-blue-400" : ""}`} />
                        {item.label}

                        {item.badge !== undefined && item.badge > 0 && (
                            <span className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shadow-lg animate-pulse bg-orange-500 text-white border-2 border-white`}>
                                {item.badge}
                            </span>
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
