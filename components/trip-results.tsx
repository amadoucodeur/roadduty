"use client"

import { useEffect, useState } from "react"
import { RouteMap } from "@/components/route-map"
import { EldLogSheet } from "@/components/eld-log-sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Map, FileText, Loader2 } from "lucide-react"
import { generateRestStops, generateDutyStatusLog, type RestStop, type DutyStatus } from "@/lib/hos-calculator"
import { calculateRoute } from "@/lib/route-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TripResultsProps {
  tripData: {
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsed: number
  }
}

export function TripResults({ tripData }: TripResultsProps) {
  const [restStops, setRestStops] = useState<RestStop[]>([])
  const [dutyLog, setDutyLog] = useState<DutyStatus[]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [coordinates, setCoordinates] = useState<Array<{ lat: number; lng: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const calculateTrip = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("[v0] Calculating route with HOS rules for:", tripData)

        const route = await calculateRoute([
          tripData.currentLocation,
          tripData.pickupLocation,
          tripData.dropoffLocation,
        ])

        console.log("[v0] Route calculated:", route)

        const stops = generateRestStops(
          tripData.currentLocation,
          tripData.pickupLocation,
          tripData.dropoffLocation,
          route.distance,
          tripData.currentCycleUsed,
        )

        const log = generateDutyStatusLog(stops)

        const duration = log.reduce((sum, entry) => sum + entry.duration, 0)

        setRestStops(stops)
        setDutyLog(log)
        setTotalDistance(route.distance)
        setTotalDuration(Number(duration.toFixed(1)))
        setCoordinates(route.coordinates)

        console.log("[v0] Generated", stops.length, "stops and", log.length, "duty log entries")
      } catch (err) {
        console.error("[v0] Error calculating trip:", err)
        setError("Failed to calculate route. Please check your locations and try again.")
      } finally {
        setIsLoading(false)
      }
    }

    calculateTrip()
  }, [tripData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Calculating Your Route</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing HOS requirements and generating DOT-compliant logs...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            Route Map
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            ELD Log Sheets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6">
          <RouteMap
            currentLocation={tripData.currentLocation}
            pickupLocation={tripData.pickupLocation}
            dropoffLocation={tripData.dropoffLocation}
            currentCycleUsed={tripData.currentCycleUsed}
            restStops={restStops}
            totalDistance={totalDistance}
            totalDuration={totalDuration}
            coordinates={coordinates}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <EldLogSheet
            date={new Date().toISOString().split("T")[0]}
            driverName="John Doe"
            vehicleId="TRK-001"
            tripData={tripData}
            dutyLog={dutyLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
