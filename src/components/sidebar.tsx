'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Clock, Users, LogOut, Briefcase, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Sidebar({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname()

  const routes = [
    { label: 'Prehľad', icon: LayoutDashboard, href: `/${slug}`, color: 'text-sky-500' },
    { label: 'Klienti', icon: Users, href: `/${slug}/clients`, color: 'text-blue-500' },
    { label: 'Projekty & Tasky', icon: CheckSquare, href: `/${slug}/jobs`, color: 'text-violet-500' },
    { label: 'Plánovač', icon: Users, href: `/${slug}/planner`, color: 'text-orange-500' },
    // Traffic link is conditionally visible (see below)
    { label: 'Timesheety', icon: Clock, href: `/${slug}/timesheets`, color: 'text-pink-700' },
  ]

  // Admin vidí nastavenia tímu (bez zložitého nastavenia sadzieb)
  if (role === 'ADMIN') {
    routes.push({ label: 'Môj Tím', icon: Briefcase, href: `/${slug}/agency`, color: 'text-slate-400' })
  }

  // Traffic / Account / Admin / Superadmin should see the Traffic management view
  const showTraffic = ['ADMIN', 'TRAFFIC', 'ACCOUNT', 'SUPERADMIN', 'CREATIVE'].includes(role)
  if (showTraffic) {
    // insert Traffic before Timesheets for better visibility
    const idx = routes.findIndex(r => r.label === 'Timesheety')
    const trafficRoute = { label: 'Traffic', icon: ArrowRightLeft, href: `/${slug}/traffic`, color: 'text-emerald-500' }
    if (idx >= 0) routes.splice(idx, 0, trafficRoute)
    else routes.push(trafficRoute)
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-white/10 shadow-xl">
      <div className="px-3 py-2 flex-1">
        <Link href={`/${slug}`} className="flex items-center pl-3 mb-10 hover:opacity-80 transition">
          <h1 className="text-xl font-bold italic">
            Môj<span className="text-blue-500 text-2xl">.</span>Flow
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/');
            return (
              <Link key={route.href} href={route.href} className={cn('text-sm group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all', isActive ? 'text-white bg-white/20 shadow-sm' : 'text-zinc-400')}>
                <div className="flex items-center flex-1">
                  <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                  {route.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="px-3 py-4 border-t border-white/10">
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10 group"
          onClick={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            window.location.href = "/login"
          }}>
          <LogOut className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors" /> Odhlásiť sa
        </Button>
      </div>
    </div>
  )
}