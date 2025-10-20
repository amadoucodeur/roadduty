"use client"

import { useState } from "react"
import { TripEntryForm } from "@/components/trip-entry-form"
import { TripResults } from "@/components/trip-results"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Truck, LogOut, Clock, MapPin, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [showResults, setShowResults] = useState(false)
  const [tripData, setTripData] = useState<{
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsed: number
  } | null>(null)

  const handleFormSubmit = (data: {
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsed: number
  }) => {
    console.log("[v0] Dashboard received trip data:", data)
    setTripData(data)
    setShowResults(true)
  }

  const handleNewTrip = () => {
    setShowResults(false)
    setTripData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
              <Truck className="h-7 w-7 text-accent relative" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                RoadDuty
              </span>
              <p className="text-xs text-muted-foreground">Logistics Platform</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          {!showResults ? (
            <>
              {/* Hero Section */}
              <div className="mb-12 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <Clock className="h-3 w-3" />
                    Quick Entry
                  </Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-balance mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/60">
                  New Daily Log
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
                  Enter your trip information below. Your DOT-compliant log will be generated automatically with
                  real-time validation.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-card border rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">Route Tracking</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Automatic location and mileage calculation</p>
                </div>

                <div className="bg-card border rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">DOT Compliance</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Meets all federal logging requirements</p>
                </div>

                <div className="bg-card border rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-chart-3/10 rounded-lg">
                      <Clock className="h-5 w-5 text-chart-3" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">Time Management</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Smart hours of service tracking</p>
                </div>
              </div>

              {/* Form Section */}
              <div className="bg-card border rounded-2xl shadow-xl p-6 lg:p-8">
                <TripEntryForm onSubmit={handleFormSubmit} />
              </div>
            </>
          ) : (
            <>
              {/* Results Header */}
              <div className="mb-8">
                <Button variant="outline" onClick={handleNewTrip} className="gap-2 mb-4 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  New Trip
                </Button>
                <h1 className="text-4xl font-bold text-balance mb-2">Trip Plan & ELD Logs</h1>
                <p className="text-lg text-muted-foreground">
                  Route calculated with required rest stops and DOT-compliant log sheets
                </p>
              </div>

              {/* Results */}
              {tripData && <TripResults tripData={tripData} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
