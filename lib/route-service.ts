interface Coordinates {
  lat: number
  lng: number
}

interface RouteResponse {
  distance: number // in miles
  duration: number // in hours
  coordinates: Coordinates[]
}

/**
 * Geocode an address to coordinates
 * In production, this would use a real geocoding API
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const coordMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
  if (coordMatch) {
    return {
      lat: Number.parseFloat(coordMatch[1]),
      lng: Number.parseFloat(coordMatch[2]),
    }
  }

  // Mock geocoding - in production, use Nominatim (free) or Google Geocoding API
  // For demo purposes, generate coordinates based on address hash
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const lat = 30 + (hash % 20) // 30-50 latitude (US range)
  const lng = -120 + (hash % 40) // -120 to -80 longitude (US range)

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return { lat, lng }
}

/**
 * Calculate route between multiple points
 * Enhanced to use GPS coordinates when available
 */
export async function calculateRoute(
  locations: string[],
  gpsCoordinates?: (Coordinates | undefined)[],
): Promise<RouteResponse> {
  const coordinates = await Promise.all(
    locations.map(async (loc, index) => {
      if (gpsCoordinates && gpsCoordinates[index]) {
        return gpsCoordinates[index]!
      }
      return geocodeAddress(loc)
    }),
  )

  // Calculate total distance using Haversine formula
  let totalDistance = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    const dist = calculateDistance(coordinates[i], coordinates[i + 1])
    totalDistance += dist
  }

  // Average truck speed: 55 mph on highways, accounting for traffic and stops
  const averageSpeed = 50 // mph (more conservative for trucks)
  const duration = totalDistance / averageSpeed

  return {
    distance: Math.round(totalDistance),
    duration: Number(duration.toFixed(2)),
    coordinates,
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLng = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Get route with real API (OpenRouteService - free tier)
 * To use: Sign up at https://openrouteservice.org/ and add NEXT_PUBLIC_OPENROUTE_API_KEY to your env vars
 */
/*
export async function calculateRouteWithAPI(
  locations: string[],
  gpsCoordinates?: (Coordinates | undefined)[]
): Promise<RouteResponse> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY
  
  if (!apiKey) {
    console.warn("[v0] No API key found, falling back to mock calculation")
    return calculateRoute(locations, gpsCoordinates)
  }

  try {
    const coordinates = await Promise.all(
      locations.map(async (location, index) => {
        if (gpsCoordinates && gpsCoordinates[index]) {
          return gpsCoordinates[index]!
        }
        
        // Geocode using Nominatim (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
        )
        const data = await response.json()
        if (data.length === 0) throw new Error(`Could not geocode: ${location}`)
        
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }
      })
    )

    // Calculate route using OpenRouteService
    const routeResponse = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-hgv`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: coordinates.map(c => [c.lng, c.lat]),
        }),
      }
    )

    if (!routeResponse.ok) {
      throw new Error('Route API request failed')
    }

    const routeData = await routeResponse.json()
    const route = routeData.routes[0]

    return {
      distance: Math.round(route.summary.distance * 0.000621371), // meters to miles
      duration: Number((route.summary.duration / 3600).toFixed(2)), // seconds to hours
      coordinates: route.geometry.coordinates.map(c => ({ lng: c[0], lat: c[1] })),
    }
  } catch (error) {
    console.error('[v0] API route calculation failed:', error)
    // Fallback to mock calculation
    return calculateRoute(locations, gpsCoordinates)
  }
}
*/
