"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DailyLogForm } from "@/components/daily-log-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Truck, Download, Printer as Print } from "lucide-react"
import Link from "next/link"

export default function DailyLogPage() {
  const router = useRouter()
  const [tripData, setTripData] = useState<any>(null)

  useEffect(() => {
    const storedData = sessionStorage.getItem("tripData")
    if (storedData) {
      setTripData(JSON.parse(storedData))
    } else {
      // If no data, redirect to dashboard
      router.push("/dashboard")
    }
  }, [router])

  if (!tripData) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {"Retour"}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">RoadDuty</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Print className="h-4 w-4 mr-2" />
              {"Imprimer"}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {"Télécharger PDF"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            {"✓ Journal de bord généré conformément aux normes HOS (Hours of Service) du DOT"}
          </p>
        </div>
        <DailyLogForm tripData={tripData} />
      </main>
    </div>
  )
}
