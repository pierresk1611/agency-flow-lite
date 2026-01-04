import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgencySettingsForm } from "./agency-form"
import { UsersSettings } from "./users-settings"

export default async function SettingsPage({ params }: { params: { slug: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')

    // Only ADMIN and SUPERADMIN can access
    if (!['ADMIN', 'SUPERADMIN'].includes(session.role)) {
        redirect(`/${params.slug}`)
    }

    const agency = await prisma.agency.findUnique({
        where: { slug: params.slug },
        include: {
            users: {
                where: { active: true }, // Len aktívni užívatelia
                orderBy: { name: 'asc' }
            },
            positions: true // Načítame existujúce pozície pre dropdowny
        }
    })

    if (!agency) return notFound()

    // Zoskupenie užívateľov podľa pozície/kategórie si spravíme v Client Componente alebo tu
    // Pre "UsersSettings" potrebujeme: users, positions, allAgencyUsers (pre dropdown internal account)

    // Pre "Internal Account" dropdown potrebujeme zoznam userov
    const allUsers = agency.users;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                    Nastavenia
                </h2>
            </div>

            <Tabs defaultValue="agency" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="agency">Agentúra</TabsTrigger>
                    <TabsTrigger value="users">Tím a Užívatelia</TabsTrigger>
                </TabsList>

                <TabsContent value="agency" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Údaje Agentúry</CardTitle>
                            <CardDescription>Základné informácie a nastavenia fakturácie.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgencySettingsForm agency={agency} allUsers={allUsers} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Správa Tímu</CardTitle>
                            <CardDescription>Pridávanie a správa užívateľov, prideľovanie rolí a pozícií.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsersSettings
                                agencyId={agency.id}
                                initialUsers={allUsers}
                                initialPositions={agency.positions}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
