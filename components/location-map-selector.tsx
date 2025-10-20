"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocationMapSelectorProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void
  onClose: () => void
  title: string
  initialCenter?: { lat: number; lng: number }
}

export function LocationMapSelector({ onLocationSelect, onClose, title, initialCenter }: LocationMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default

      // Initialize map
      const center = initialCenter || { lat: 39.8283, lng: -98.5795 } // Center of USA
      const map = L.map(mapRef.current!).setView([center.lat, center.lng], initialCenter ? 13 : 4)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add click handler
      map.on("click", (e: any) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng }
        setSelectedCoords(coords)

        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.remove()
        }

        // Add new marker
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background: hsl(var(--primary)); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        markerRef.current = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map)
      })

      mapInstanceRef.current = map
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [initialCenter])

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          <div ref={mapRef} className="absolute inset-0 rounded-b-lg" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {selectedCoords ? (
              <span className="font-mono">
                Selected: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </span>
            ) : (
              <span>Click on the map to select a location</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedCoords}>
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
