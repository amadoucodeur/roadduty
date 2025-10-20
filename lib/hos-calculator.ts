export interface HOSLimits {
  maxDrivingHours: number // 11 hours
  maxOnDutyHours: number // 14 hours
  requiredBreakAfter: number // 8 hours
  breakDuration: number // 30 minutes
  requiredRestPeriod: number // 10 hours
  maxCycleHours: number // 70 hours in 8 days
  restartHours: number // 34 hours
}

export interface DutyStatus {
  status: "off-duty" | "sleeper" | "driving" | "on-duty"
  startTime: Date
  endTime: Date
  duration: number // in hours
  location: string
  notes?: string
}

export interface RestStop {
  location: string
  type: "current" | "pickup" | "dropoff" | "rest"
  arrivalTime: string
  duration?: string
  reason?: string
  distanceFromStart: number
}

// Standard HOS limits for property-carrying drivers
export const HOS_LIMITS: HOSLimits = {
  maxDrivingHours: 11,
  maxOnDutyHours: 14,
  requiredBreakAfter: 8,
  breakDuration: 0.5, // 30 minutes
  requiredRestPeriod: 10,
  maxCycleHours: 70,
  restartHours: 34,
}

/**
 * Calculate required rest stops based on driving time and HOS regulations
 */
export function calculateRestStops(
  totalDrivingHours: number,
  currentCycleUsed: number,
  startTime: Date = new Date(),
): {
  needsBreak: boolean
  needsRest: boolean
  needsRestart: boolean
  breakAfterHours: number
  restAfterHours: number
  remainingCycleHours: number
} {
  const remainingCycleHours = HOS_LIMITS.maxCycleHours - currentCycleUsed

  // Check if 30-minute break is needed
  const needsBreak = totalDrivingHours > HOS_LIMITS.requiredBreakAfter

  // Check if 10-hour rest is needed
  const needsRest = totalDrivingHours > HOS_LIMITS.maxDrivingHours

  // Check if 34-hour restart is needed
  const needsRestart = currentCycleUsed >= HOS_LIMITS.maxCycleHours - 10 // Within 10 hours of limit

  // Calculate when breaks are needed
  const breakAfterHours = HOS_LIMITS.requiredBreakAfter
  const restAfterHours = HOS_LIMITS.maxDrivingHours

  return {
    needsBreak,
    needsRest,
    needsRestart,
    breakAfterHours,
    restAfterHours,
    remainingCycleHours,
  }
}

/**
 * Generate rest stops along a route based on distance and time
 */
export function generateRestStops(
  currentLocation: string,
  pickupLocation: string,
  dropoffLocation: string,
  totalDistance: number,
  currentCycleUsed: number,
  startTime: Date = new Date(),
): RestStop[] {
  const stops: RestStop[] = []
  const averageSpeed = 55 // mph
  const totalDrivingHours = totalDistance / averageSpeed

  let currentTime = new Date(startTime)
  let currentDistance = 0
  let drivingHoursSinceBreak = 0
  let drivingHoursSinceRest = 0

  // Add starting location
  stops.push({
    location: currentLocation,
    type: "current",
    arrivalTime: formatTime(currentTime),
    distanceFromStart: 0,
  })

  // Calculate distance to pickup (assume 1/3 of total for demo)
  const distanceToPickup = totalDistance * 0.25
  const hoursToPickup = distanceToPickup / averageSpeed

  currentTime = addHours(currentTime, hoursToPickup)
  currentDistance += distanceToPickup
  drivingHoursSinceBreak += hoursToPickup
  drivingHoursSinceRest += hoursToPickup

  // Add pickup location
  stops.push({
    location: pickupLocation,
    type: "pickup",
    arrivalTime: formatTime(currentTime),
    distanceFromStart: currentDistance,
    duration: "30 min",
    reason: "Loading cargo",
  })

  // Add 30 minutes for pickup
  currentTime = addHours(currentTime, 0.5)

  // Calculate remaining distance
  const remainingDistance = totalDistance - distanceToPickup
  let distanceCovered = 0

  // Generate rest stops based on HOS rules
  while (distanceCovered < remainingDistance) {
    // Check if 30-minute break is needed
    if (
      drivingHoursSinceBreak >= HOS_LIMITS.requiredBreakAfter &&
      drivingHoursSinceBreak < HOS_LIMITS.maxDrivingHours
    ) {
      const breakDistance = HOS_LIMITS.requiredBreakAfter * averageSpeed
      currentDistance += breakDistance
      distanceCovered += breakDistance
      currentTime = addHours(currentTime, HOS_LIMITS.requiredBreakAfter)

      stops.push({
        location: `Rest Area - Mile ${Math.round(currentDistance)}`,
        type: "rest",
        arrivalTime: formatTime(currentTime),
        duration: "30 min",
        reason: "Required 30-minute break after 8 hours driving",
        distanceFromStart: currentDistance,
      })

      currentTime = addHours(currentTime, HOS_LIMITS.breakDuration)
      drivingHoursSinceBreak = 0
    }
    // Check if 10-hour rest is needed
    else if (drivingHoursSinceRest >= HOS_LIMITS.maxDrivingHours) {
      const restDistance = (HOS_LIMITS.maxDrivingHours - drivingHoursSinceBreak) * averageSpeed
      currentDistance += restDistance
      distanceCovered += restDistance
      currentTime = addHours(currentTime, HOS_LIMITS.maxDrivingHours - drivingHoursSinceBreak)

      stops.push({
        location: `Truck Stop - Mile ${Math.round(currentDistance)}`,
        type: "rest",
        arrivalTime: formatTime(currentTime),
        duration: "10 hours",
        reason: "Required 10-hour rest period",
        distanceFromStart: currentDistance,
      })

      currentTime = addHours(currentTime, HOS_LIMITS.requiredRestPeriod)
      drivingHoursSinceBreak = 0
      drivingHoursSinceRest = 0
    }
    // Continue driving
    else {
      const remainingDrivingTime = Math.min(
        HOS_LIMITS.requiredBreakAfter - drivingHoursSinceBreak,
        HOS_LIMITS.maxDrivingHours - drivingHoursSinceRest,
        (remainingDistance - distanceCovered) / averageSpeed,
      )

      currentDistance += remainingDrivingTime * averageSpeed
      distanceCovered += remainingDrivingTime * averageSpeed
      currentTime = addHours(currentTime, remainingDrivingTime)
      drivingHoursSinceBreak += remainingDrivingTime
      drivingHoursSinceRest += remainingDrivingTime
    }
  }

  // Add dropoff location
  stops.push({
    location: dropoffLocation,
    type: "dropoff",
    arrivalTime: formatTime(currentTime),
    distanceFromStart: totalDistance,
  })

  return stops
}

/**
 * Generate duty status log entries for ELD
 */
export function generateDutyStatusLog(restStops: RestStop[], startTime: Date = new Date()): DutyStatus[] {
  const dutyLog: DutyStatus[] = []
  let currentTime = new Date(startTime)

  for (let i = 0; i < restStops.length - 1; i++) {
    const currentStop = restStops[i]
    const nextStop = restStops[i + 1]

    // Determine duty status based on stop type
    if (currentStop.type === "rest") {
      // Rest stop - off duty or sleeper
      const duration = currentStop.duration?.includes("hour") ? 10 : 0.5
      dutyLog.push({
        status: duration >= 2 ? "sleeper" : "off-duty",
        startTime: new Date(currentTime),
        endTime: addHours(currentTime, duration),
        duration,
        location: currentStop.location,
        notes: currentStop.reason,
      })
      currentTime = addHours(currentTime, duration)
    } else if (currentStop.type === "pickup") {
      // Pickup - on duty not driving
      dutyLog.push({
        status: "on-duty",
        startTime: new Date(currentTime),
        endTime: addHours(currentTime, 0.5),
        duration: 0.5,
        location: currentStop.location,
        notes: "Loading cargo",
      })
      currentTime = addHours(currentTime, 0.5)
    }

    // Driving to next stop
    const drivingTime = calculateDrivingTime(currentStop.distanceFromStart, nextStop.distanceFromStart)
    dutyLog.push({
      status: "driving",
      startTime: new Date(currentTime),
      endTime: addHours(currentTime, drivingTime),
      duration: drivingTime,
      location: `${currentStop.location} → ${nextStop.location}`,
    })
    currentTime = addHours(currentTime, drivingTime)
  }

  return dutyLog
}

// Helper functions
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function calculateDrivingTime(startDistance: number, endDistance: number): number {
  const distance = endDistance - startDistance
  const averageSpeed = 55 // mph
  return distance / averageSpeed
}

/**
 * Calculate total hours for a duty status log
 */
export function calculateTotalHours(dutyLog: DutyStatus[]): {
  totalDriving: number
  totalOnDuty: number
  totalOffDuty: number
} {
  let totalDriving = 0
  let totalOnDuty = 0
  let totalOffDuty = 0

  for (const entry of dutyLog) {
    if (entry.status === "driving") {
      totalDriving += entry.duration
      totalOnDuty += entry.duration
    } else if (entry.status === "on-duty") {
      totalOnDuty += entry.duration
    } else {
      totalOffDuty += entry.duration
    }
  }

  return {
    totalDriving: Number(totalDriving.toFixed(2)),
    totalOnDuty: Number(totalOnDuty.toFixed(2)),
    totalOffDuty: Number(totalOffDuty.toFixed(2)),
  }
}
