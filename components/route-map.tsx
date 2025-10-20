"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, Package, Coffee, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RouteStop {
  location: string
  type: "current" | "pickup" | "dropoff" | "rest"
  arrivalTime?: string
  duration?: string
  reason?: string
}

interface RouteMapProps {
  currentLocation: string
  pickupLocation: string
  dropoffLocation: string
  currentCycleUsed: number
  restStops: RouteStop[]
  totalDistance: number
  totalDuration: number
  coordinates?: Array<{ lat: number; lng: number }>
}

export function RouteMap({
  currentLocation,
  pickupLocation,
  dropoffLocation,
  currentCycleUsed,
  restStops,
  totalDistance,
  totalDuration,
  coordinates = [],
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    const loadMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return

      try {
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        mapRef.current.innerHTML = ""

        const centerLat = coordinates.length > 0 ? coordinates[0].lat : 39.8283
        const centerLng = coordinates.length > 0 ? coordinates[0].lng : -98.5795

        const map = L.map(mapRef.current).setView([centerLat, centerLng], 4)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        const createIcon = (color: string, icon: string) => {
          return L.divIcon({
            html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <span style="color: white; font-size: 16px;">${icon}</span>
            </div>`,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        }

        const markers: L.Marker[] = []

        const markerPositions =
          coordinates.length >= 3
            ? coordinates
            : [
                { lat: centerLat, lng: centerLng },
                { lat: centerLat + 0.5, lng: centerLng + 2 },
                { lat: centerLat - 0.5, lng: centerLng + 4 },
              ]

        // Current location marker
        const currentMarker = L.marker([markerPositions[0].lat, markerPositions[0].lng], {
          icon: createIcon("#3b82f6", "📍"),
        })
          .addTo(map)
          .bindPopup(`<b>Current Location</b><br/>${currentLocation}`)
        markers.push(currentMarker)

        // Pickup location marker
        const pickupMarker = L.marker([markerPositions[1].lat, markerPositions[1].lng], {
          icon: createIcon("#f97316", "📦"),
        })
          .addTo(map)
          .bindPopup(`<b>Pickup Location</b><br/>${pickupLocation}`)
        markers.push(pickupMarker)

        // Rest stop markers
        restStops.forEach((stop, index) => {
          if (stop.type === "rest") {
            const progress = (index + 1) / (restStops.length + 1)
            const lat = markerPositions[0].lat + (markerPositions[2].lat - markerPositions[0].lat) * progress
            const lng = markerPositions[0].lng + (markerPositions[2].lng - markerPositions[0].lng) * progress

            const restMarker = L.marker([lat, lng], {
              icon: createIcon("#10b981", "☕"),
            })
              .addTo(map)
              .bindPopup(`<b>Rest Stop ${index + 1}</b><br/>${stop.reason}<br/>Duration: ${stop.duration}`)
            markers.push(restMarker)
          }
        })

        // Dropoff location marker
        const dropoffMarker = L.marker([markerPositions[2].lat, markerPositions[2].lng], {
          icon: createIcon("#8b5cf6", "🎯"),
        })
          .addTo(map)
          .bindPopup(`<b>Dropoff Location</b><br/>${dropoffLocation}`)
        markers.push(dropoffMarker)

        // Draw route line
        const routeCoordinates: [number, number][] = markers.map((m) => m.getLatLng()).map((ll) => [ll.lat, ll.lng])

        L.polyline(routeCoordinates, {
          color: "#f97316",
          weight: 4,
          opacity: 0.7,
          dashArray: "10, 10",
        }).addTo(map)

        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))

        setMapLoaded(true)
      } catch (error) {
        console.error("[v0] Error loading map:", error)
      }
    }

    loadMap()
  }, [currentLocation, pickupLocation, dropoffLocation, restStops, coordinates])

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="overflow-hidden border-2 relative">
        <div ref={mapRef} className="w-full h-[500px] bg-muted" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </Card>

      {/* Route Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Distance</p>
              <p className="text-2xl font-bold">{totalDistance} mi</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Coffee className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rest Stops</p>
              <p className="text-2xl font-bold">{restStops.filter((s) => s.type === "rest").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-3/10 rounded-lg">
              <MapPin className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Duration</p>
              <p className="text-2xl font-bold">{totalDuration} hrs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stop Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Route Stops
        </h3>
        <div className="space-y-3">
          {restStops.map((stop, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="mt-1">
                {stop.type === "current" && <Navigation className="h-5 w-5 text-primary" />}
                {stop.type === "pickup" && <Package className="h-5 w-5 text-accent" />}
                {stop.type === "rest" && <Coffee className="h-5 w-5 text-chart-3" />}
                {stop.type === "dropoff" && <MapPin className="h-5 w-5 text-chart-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{stop.location}</p>
                  <Badge variant="secondary" className="text-xs">
                    {stop.type === "current" && "Start"}
                    {stop.type === "pickup" && "Pickup"}
                    {stop.type === "rest" && "Rest Break"}
                    {stop.type === "dropoff" && "Destination"}
                  </Badge>
                </div>
                {stop.arrivalTime && <p className="text-sm text-muted-foreground">Arrival: {stop.arrivalTime}</p>}
                {stop.reason && <p className="text-sm text-muted-foreground">{stop.reason}</p>}
                {stop.duration && <p className="text-sm font-medium text-accent">Duration: {stop.duration}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* HOS Warning */}
      {currentCycleUsed > 60 && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            <strong>Warning:</strong> You have used {currentCycleUsed} hours of your 70-hour cycle. Consider planning
            for a 34-hour restart soon.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
