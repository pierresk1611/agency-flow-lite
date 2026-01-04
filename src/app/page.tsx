import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import {
  ArrowRight,
  Clock,
  Zap,
  Link as LinkIcon,
  CheckCircle2,
  Layout,
  CalendarDays,
  Users
} from 'lucide-react'

export default async function LandingPage() {
  const session = await getSession()
  let redirectUrl = '#'

  if (session) {
    if (session.role === 'SUPERADMIN') {
      redirectUrl = '/superadmin'
    } else if (session.slug) {
      redirectUrl = `/${session.slug}`
    } else {
      const agency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
      redirectUrl = `/${agency?.slug || session.agencyId}`
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">

      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black italic tracking-tighter">
            Agency<span className="text-sky-500">Lite</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href={redirectUrl}>
                <Button className="font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                  Otvoriť Appku <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 hidden sm:block">
                  Prihlásenie
                </Link>
                <Link href="/register">
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-200 transition-all hover:scale-105">
                    Vyskúšať zadarmo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-24 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-widest mb-8 border border-sky-100">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          Pre menšie tímy a freelancerov
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 text-slate-900">
          Projektový manažment <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">bez bolenia hlavy.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Udržujte si poriadok v zákazkách, trackujte čas a nestrácajte hodiny nastavovaním zložitých nástrojov.
          Rýchle, jednoduché a prepojené s vašimi obľúbenými appkami.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto font-bold shadow-xl">
              Začať 14-dňový Trial
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-slate-300 font-bold hover:bg-slate-50">
              Čo to dokáže?
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-400 font-medium uppercase tracking-wider">
          Bez kreditnej karty • Okamžitý prístup • Manuálne schvaľovanie do 48 hod.
        </p>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Všetko podstatné, nič navyše</h2>
            <p className="text-slate-500 font-medium">Osekali sme zbytočnosti. Zostal len čistý workflow.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 text-center font-bold text-sm uppercase tracking-widest italic">
              AgencyFlow <span className="text-sky-400">Lite</span>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-y-6 gap-x-12">
              <CheckItem text="Okamžitý prehľad projektov a taskov" />
              <CheckItem text="Smart stopky a meranie času" />
              <CheckItem text="Plánovanie kapacít (Plán vs. Realita)" />
              <CheckItem text="Integrácia liniek (Asana, ClickUp, Freelo)" />
              <CheckItem text="Jednoduchá správa klientov" />
              <CheckItem text="Žiadne zložité tendre a fakturácie" />
              <CheckItem text="Prehľad vyťaženosti tímu" />
              <CheckItem text="Rýchle nasadenie do 5 minút" />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight uppercase italic">Nástroje pre modernú prácu</h2>
          <p className="text-lg text-slate-500 font-medium">
            Navrhnuté tak, aby vás nezdržovali od toho najdôležitejšieho – od vašej práce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <FeatureCard
            icon={Clock}
            color="text-blue-600"
            bg="bg-blue-50"
            title="Smart Stopky"
            desc="Klikneš a meriaš. Systém automaticky zapíše čas do denného prehľadu. Na konci dňa presne vieš, koľko si na čom strávil."
          />

          <FeatureCard
            icon={LinkIcon}
            color="text-purple-600"
            bg="bg-purple-50"
            title="Externé Linky"
            desc="Používate Asanu, ClickUp alebo Freelo? Nevadí. Vložte link priamo do tasku v AgencyFlow a majte všetko pokope na jeden klik."
          />

          <FeatureCard
            icon={CalendarDays}
            color="text-emerald-600"
            bg="bg-emerald-50"
            title="Plánovač Kapacít"
            desc="Vizuálny prehľad na 2 týždne. Vidíte, čo ste si naplánovali a koľko ste reálne odpracovali. Ideálne pre sebareflexiu."
          />

          <FeatureCard
            icon={Zap}
            color="text-amber-600"
            bg="bg-amber-50"
            title="Žiadna Byrokracia"
            desc="Vyhodili sme zložité schvaľovania, tendre a finančné tabuľky. Lite verzia je o rýchlosti a čistom prehľade."
          />

          <FeatureCard
            icon={Users}
            color="text-indigo-600"
            bg="bg-indigo-50"
            title="Prehľad Tímu"
            desc="Máte malý tím? Na dashboarde hneď vidíte, kto je preťažený a kto má voľno. Rozdeľovanie práce nikdy nebolo jednoduchšie."
          />

          <FeatureCard
            icon={Layout}
            color="text-slate-600"
            bg="bg-slate-100"
            title="Intuitívne UI"
            desc="Nebojujte so softvérom. Čistý a moderný dizajn, v ktorom sa zorientujete okamžite. Žiadne skryté menu a zložité nastavenia."
          />

        </div>
      </section>

      {/* --- PRICING / INFO CTA --- */}
      <section className="py-20 border-t border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-6 tracking-tight uppercase">Začnite hneď teraz</h2>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <p className="text-slate-600 mb-8 font-medium text-lg">
              Vyskúšajte si AgencyFlow Lite na <strong>14 dní zadarmo</strong>.<br />
              (S možnosťou predĺženia).
            </p>
            <div className="flex justify-center">
              <Link href="/register">
                <Button className="w-64 h-14 text-lg bg-slate-900 text-white font-black uppercase italic shadow-2xl hover:scale-105 transition-transform">
                  Vytvoriť účet zadarmo
                </Button>
              </Link>
            </div>

            {/* DÔLEŽITÉ INFO */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2 font-medium">
              <p>
                <span className="font-bold text-slate-700 uppercase tracking-wider">Poznámka:</span> Schválenie registrácie môže trvať až <strong className="text-slate-900">48 hodín</strong> (manuálna kontrola).
              </p>
              <p>
                V prípade otázok nás neváhajte kontaktovať na <a href="mailto:agencyflowapp@gmail.com" className="text-sky-600 hover:underline font-bold">agencyflowapp@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center text-slate-400 text-sm bg-white border-t border-slate-100">
        <p className="mb-4 font-black text-slate-900 text-lg italic tracking-tighter">Agency<span className="text-sky-500">Lite</span></p>
        <div className="flex justify-center gap-6 mb-6 font-bold uppercase text-[10px] tracking-widest">
          <Link href="#" className="hover:text-slate-600 transition">Kontakt</Link>
          <Link href="#" className="hover:text-slate-600 transition">Podmienky</Link>
          <Link href="#" className="hover:text-slate-600 transition">GDPR</Link>
        </div>
        <p className="text-[10px]">&copy; {new Date().getFullYear()} Všetky práva vyhradené.</p>
      </footer>
    </div>
  )
}

// --- POMOCNÉ KOMPONENTY ---

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-sky-100 text-sky-600 rounded-full p-1 shadow-sm">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className="font-bold text-slate-700 text-sm">{text}</span>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, bg }: { icon: any, title: string, desc: string, color: string, bg: string }) {
  return (
    <div className="p-8 border border-slate-100 rounded-2xl hover:shadow-2xl transition-all hover:border-sky-200 group bg-white flex flex-col items-start shadow-sm">
      <div className={`h-14 w-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 shadow-sm transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-xl text-slate-900 mb-3 tracking-tight italic">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  )
}