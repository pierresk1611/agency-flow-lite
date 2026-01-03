import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function TrialExpiredPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl border-red-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-red-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900">Platnosť licencie vypršala</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-slate-600 leading-relaxed">
                        Vaša skúšobná doba (Trial) pre túto agentúru sa skončila.
                        Pre obnovenie prístupu a aktiváciu plnej verzie nás prosím kontaktujte.
                    </p>

                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-1">Billing Support</h3>
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-lg">
                            <Mail className="h-5 w-5" />
                            <a href="mailto:billing@agencyflow.com" className="hover:underline">billing@agencyflow.com</a>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                Späť na prihlásenie
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
