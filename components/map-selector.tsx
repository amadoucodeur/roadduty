"use client";

import { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { MapPinned, Loader2, MapPin } from "lucide-react";

interface MapSelectorProps {
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  initialCoords?: { lat: number; lng: number };
}

export default function MapSelector({
  onLocationSelect,
  initialCoords,
}: MapSelectorProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialCoords || null
  );
  const [center, setCenter] = useState<[number, number]>([5.345317, -4.024429]); // fallback: Abidjan
  const [zoom, setZoom] = useState(13);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator && !initialCoords) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter([latitude, longitude]);
          setCoords({ lat: latitude, lng: longitude });
          setIsLoadingLocation(false);
          setLocationError(null);
        },
        (err) => {
          console.warn("Géolocalisation refusée ou indisponible:", err.message);
          setLocationError("Impossible d'accéder à votre position");
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }
  }, [initialCoords]);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    const [lat, lng] = latLng;
    setCoords({ lat, lng });
    onLocationSelect?.({ lat, lng });
  };

  const handleConfirm = () => {
    if (coords && onLocationSelect) {
      onLocationSelect(coords);
    }
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter([latitude, longitude]);
          setCoords({ lat: latitude, lng: longitude });
          onLocationSelect?.({ lat: latitude, lng: longitude });
          setIsLoadingLocation(false);
          setLocationError(null);
        },
        (err) => {
          setLocationError("Impossible d'accéder à votre position");
          setIsLoadingLocation(false);
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <MapPinned className="h-4 w-4" />
          {coords ? "Modify position" : "Select a position"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select a GPS position
          </DialogTitle>
          <DialogDescription>
            Click on the map to select an exact position. You can also use your
            current location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="w-full h-[400px] rounded-lg overflow-hidden border">
            <Map
              center={center}
              zoom={zoom}
              onBoundsChanged={({ center, zoom }) => {
                setCenter(center);
                setZoom(zoom);
              }}
              onClick={handleMapClick}
            >
              {coords && (
                <Marker
                  anchor={[coords.lat, coords.lng]}
                  color="#ef4444"
                  width={40}
                />
              )}
            </Map>
          </div>

          {isLoadingLocation && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-blue-700">
                Localisation en cours...
              </span>
            </div>
          )}

          {locationError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          )}

          {coords && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Position sélectionnée :</span>{" "}
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPinned className="h-4 w-4 mr-2" />
              )}
              Ma position actuelle
            </Button>

            <Button onClick={handleConfirm} disabled={!coords}>
              Confirmer la position
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
