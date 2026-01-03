'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="sk">
            <body className={inter.className}>
                <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white">
                    <h2 className="text-2xl font-bold text-slate-900">Kritická chyba aplikácie</h2>
                    <p className="text-slate-500 max-w-sm">
                        Nastala neočakávaná chyba, ktorú sa nepodarilo zachytiť.
                    </p>
                    <Button onClick={() => reset()} variant="default">
                        Skúsiť znova
                    </Button>
                </div>
            </body>
        </html>
    )
}
