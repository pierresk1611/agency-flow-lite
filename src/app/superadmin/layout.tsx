import { prisma } from '@/lib/prisma'
import { SuperAdminNav } from '@/components/superadmin-nav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Fetch pending count directly in Server Component
  const pendingCount = await prisma.agency.count({
    where: { status: 'PENDING' }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl tracking-tighter italic">AgencyFlow</h1>
          <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded font-black uppercase">Superadmin</span>
        </div>
        <a href="/login" className="text-xs font-bold hover:text-red-400 transition-colors uppercase tracking-wider">Odhlásiť sa</a>
      </nav>
      <main className="p-8 max-w-7xl mx-auto">
        <SuperAdminNav pendingRequestsCount={pendingCount} />
        {children}
      </main>
    </div>
  )
}