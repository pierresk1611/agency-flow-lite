import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="bg-slate-100 p-4 rounded-full">
                <FileQuestion className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Stránka sa nenašla</h2>
            <p className="text-slate-500 max-w-sm">
                Požadovaná stránka alebo zdroj neexistuje.
            </p>
            <Link href="/">
                <Button variant="default">
                    Späť na úvod
                </Button>
            </Link>
        </div>
    )
}
