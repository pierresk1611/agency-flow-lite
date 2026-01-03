'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import SafeResponsiveContainer from '../ui/safe-responsive-container'

export function TimesheetStatusChart({ data }: { data: any[] }) {
  return (
    <div className="h-[180px] w-full min-w-0">
    <SafeResponsiveContainer className="h-full">
        <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} />
          <YAxis type="number" axisLine={false} tickLine={false} fontSize={10} />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="approved" name="Schválené" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={40} />
          <Bar dataKey="pending" name="Na schválenie" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
    </SafeResponsiveContainer>
    </div>
  )
}