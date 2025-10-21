import {
  parseAsBoolean,
  parseAsIsoDate,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryStates,
  parseAsArrayOf,
} from "nuqs";
import useSWR from "swr";

export const useDataStates = () =>
  useQueryStates({
    name: parseAsString.withDefault(""),
    vehicle_ID: parseAsString.withDefault(""),
    co_driver_name: parseAsString.withDefault(""),
    current_location: parseAsString.withDefault(""),
    pickup_location: parseAsString.withDefault(""),
    dropoff_location: parseAsString.withDefault(""),
    current_cycle_used: parseAsString.withDefault(""),
    carrier_name: parseAsString.withDefault(""),
    main_office: parseAsString.withDefault(""),
    shipping_docs: parseAsString.withDefault(""),
    remarks: parseAsString.withDefault(""),
  });

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error("La géolocalisation n'est pas supportée par ce navigateur.")
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function getOSRMRoute(start: any, end: any) {
  if (!start || !end) return null;

  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur de récupération de l'itinéraire");

  const data = await response.json();

  if (!data.routes?.[0]) throw new Error("Aucune route trouvée");

  const route = data.routes[0];

  return {
    distance: route.distance / 1000, // km
    duration: route.duration / 60, // minutes
    geometry: route.geometry.coordinates, // tableau [lng, lat]
  };
}


export function useOSRMRoute(start: string, end: string) {
  const startx = start?.split(",")?.[0] ?? null;
  const starty = start?.split(",")?.[1] ?? null;

  const endx = end?.split(",")?.[1] ?? null;
  const endy = end?.split(",")?.[1] ?? null;

  const START = { lat: parseFloat(starty), lng: parseFloat(startx) };
  const END = { lat: parseFloat(endy), lng: parseFloat(endx) };

  const shouldFetch = startx && starty && endx && endy;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    shouldFetch ? ["osrm-route", start, end] : null,
    () => getOSRMRoute(START, END),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    route: data,
    isLoading,
    isValidating: isValidating,
    isError: error,
    refresh: mutate,
  };
}
