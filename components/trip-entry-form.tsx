"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Clock, Navigation, Package, Sparkles, AlertCircle, User, Map } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TripEntryFormProps {
  onSubmit: (data: {
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsed: number
    driverName: string
    vehicleId: string
    coDriverName?: string
    currentLocationGPS?: { lat: number; lng: number }
    pickupLocationGPS?: { lat: number; lng: number }
    dropoffLocationGPS?: { lat: number; lng: number }
  }) => void
}

export function TripEntryForm({ onSubmit }: TripEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    currentCycleUsed: "",
    driverName: "",
    vehicleId: "",
    coDriverName: "",
  })

  const [gpsCoordinates, setGpsCoordinates] = useState<{
    current?: { lat: number; lng: number }
    pickup?: { lat: number; lng: number }
    dropoff?: { lat: number; lng: number }
  }>({})

  const [showMapSelector, setShowMapSelector] = useState<"current" | "pickup" | "dropoff" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSubmit({
      currentLocation: formData.currentLocation,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      currentCycleUsed: Number.parseFloat(formData.currentCycleUsed),
      driverName: formData.driverName,
      vehicleId: formData.vehicleId,
      coDriverName: formData.coDriverName || undefined,
      currentLocationGPS: gpsCoordinates.current,
      pickupLocationGPS: gpsCoordinates.pickup,
      dropoffLocationGPS: gpsCoordinates.dropoff,
    })

    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGetGPSLocation = (field: "current" | "pickup" | "dropoff") => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setGpsCoordinates((prev) => ({ ...prev, [field]: coords }))

          // Update the text field with coordinates
          const locationText = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          handleInputChange(`${field}Location`, locationText)
        },
        (error) => {
          console.error("[v0] GPS error:", error)
          alert("Unable to get GPS location. Please check your browser permissions.")
        },
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleMapSelect = (field: "current" | "pickup" | "dropoff") => {
    setShowMapSelector(field)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-muted-foreground">
          Enter your trip details below. We'll calculate the optimal route with required rest stops and generate your
          DOT-compliant ELD logs automatically.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">Driver Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver-name" className="text-sm font-medium">
              Driver Name *
            </Label>
            <Input
              id="driver-name"
              placeholder="e.g., John Smith"
              required
              className="h-12 text-base"
              value={formData.driverName}
              onChange={(e) => handleInputChange("driverName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle-id" className="text-sm font-medium">
              Vehicle ID *
            </Label>
            <Input
              id="vehicle-id"
              placeholder="e.g., TRK-12345"
              required
              className="h-12 text-base"
              value={formData.vehicleId}
              onChange={(e) => handleInputChange("vehicleId", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="co-driver-name" className="text-sm font-medium">
            Co-Driver Name (Optional)
          </Label>
          <Input
            id="co-driver-name"
            placeholder="e.g., Jane Doe"
            className="h-12 text-base"
            value={formData.coDriverName}
            onChange={(e) => handleInputChange("coDriverName", e.target.value)}
          />
        </div>
      </div>

      {/* Current Location Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-chart-3/10 rounded-lg">
            <Navigation className="h-5 w-5 text-chart-3" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">Current Location</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="current-location" className="text-sm font-medium">
            Where are you now?
          </Label>
          <div className="flex gap-2">
            <Input
              id="current-location"
              placeholder="e.g., Dallas, TX or click GPS/Map"
              required
              className="h-12 text-base flex-1"
              value={formData.currentLocation}
              onChange={(e) => handleInputChange("currentLocation", e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleGetGPSLocation("current")}
              className="gap-2"
            >
              <Navigation className="h-4 w-4" />
              GPS
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleMapSelect("current")}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              Map
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter address, use GPS, or select on map for precise coordinates
          </p>
        </div>
      </div>

      {/* Trip Route Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <MapPin className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">Trip Route</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup-location" className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Pickup Location
            </Label>
            <div className="flex gap-2">
              <Input
                id="pickup-location"
                placeholder="e.g., Houston, TX or click GPS/Map"
                required
                className="h-12 text-base flex-1"
                value={formData.pickupLocation}
                onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleGetGPSLocation("pickup")}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                GPS
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleMapSelect("pickup")}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                Map
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dropoff-location" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Dropoff Location
            </Label>
            <div className="flex gap-2">
              <Input
                id="dropoff-location"
                placeholder="e.g., Phoenix, AZ or click GPS/Map"
                required
                className="h-12 text-base flex-1"
                value={formData.dropoffLocation}
                onChange={(e) => handleInputChange("dropoffLocation", e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleGetGPSLocation("dropoff")}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                GPS
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleMapSelect("dropoff")}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hours of Service Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">Hours of Service</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="current-cycle" className="text-sm font-medium">
            Current Cycle Used (Hours)
          </Label>
          <Input
            id="current-cycle"
            type="number"
            min="0"
            max="70"
            step="0.5"
            placeholder="e.g., 8.5"
            required
            className="h-12 text-base"
            value={formData.currentCycleUsed}
            onChange={(e) => handleInputChange("currentCycleUsed", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter hours already used in your current 7 or 8-day cycle (0-70 hours)
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-14 text-base font-semibold gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Calculating Route & Generating Logs...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Route & ELD Logs
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          This will create your route map with rest stops and complete DOT log sheets
        </p>
      </div>

      {showMapSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">Select Location on Map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click on the map to select {showMapSelector} location (Map integration coming soon)
            </p>
            <Button onClick={() => setShowMapSelector(null)}>Close</Button>
          </div>
        </div>
      )}
    </form>
  )
}
