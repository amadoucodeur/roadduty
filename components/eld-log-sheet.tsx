"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Printer, Calendar, User, Truck } from "lucide-react"
import { type DutyStatus, calculateTotalHours } from "@/lib/hos-calculator"
import { Badge } from "@/components/ui/badge"

interface EldLogSheetProps {
  date: string
  driverName: string
  vehicleId: string
  tripData: {
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsed: number
  }
  dutyLog: DutyStatus[]
}

export function EldLogSheet({ date, driverName, vehicleId, tripData, dutyLog }: EldLogSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [totals, setTotals] = useState({ totalDriving: 0, totalOnDuty: 0, totalOffDuty: 0 })

  useEffect(() => {
    if (!canvasRef.current || dutyLog.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Calculate totals
    const calculatedTotals = calculateTotalHours(dutyLog)
    setTotals(calculatedTotals)

    // Set canvas size
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    drawGrid(ctx, width, height)

    // Draw duty status graph
    drawDutyStatusGraph(ctx, dutyLog, width, height)

    console.log("[v0] ELD log sheet rendered with", dutyLog.length, "entries")
  }, [dutyLog])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridColor = "#e5e7eb"
    const textColor = "#6b7280"
    const headerHeight = 80
    const footerHeight = 60
    const graphHeight = height - headerHeight - footerHeight
    const leftMargin = 120
    const rightMargin = 20
    const graphWidth = width - leftMargin - rightMargin
    const timeWidth = graphWidth / 24

    // Draw header background
    ctx.fillStyle = "#f9fafb"
    ctx.fillRect(0, 0, width, headerHeight)

    // Draw header text
    ctx.fillStyle = textColor
    ctx.font = "14px sans-serif"
    ctx.fillText(`Date: ${date}`, 20, 30)
    ctx.fillText(`Driver: ${driverName}`, 20, 55)
    ctx.fillText(`Vehicle: ${vehicleId}`, 250, 30)
    ctx.fillText(`Cycle Used: ${tripData.currentCycleUsed} hrs`, 250, 55)

    // Draw duty status labels
    const dutyStatuses = [
      { label: "OFF DUTY", y: headerHeight + graphHeight * 0.125, color: "#10b981" },
      { label: "SLEEPER", y: headerHeight + graphHeight * 0.375, color: "#3b82f6" },
      { label: "DRIVING", y: headerHeight + graphHeight * 0.625, color: "#f97316" },
      { label: "ON DUTY", y: headerHeight + graphHeight * 0.875, color: "#8b5cf6" },
    ]

    ctx.font = "bold 12px sans-serif"
    dutyStatuses.forEach((status) => {
      ctx.fillStyle = status.color
      ctx.fillText(status.label, 10, status.y + 5)
    })

    // Draw horizontal grid lines
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1

    for (let i = 0; i <= 4; i++) {
      const y = headerHeight + (graphHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(width - rightMargin, y)
      ctx.stroke()
    }

    ctx.fillStyle = textColor
    ctx.font = "11px sans-serif"
    ctx.textAlign = "center"

    for (let hour = 0; hour <= 24; hour++) {
      const x = leftMargin + hour * timeWidth

      // Draw vertical line
      ctx.strokeStyle = hour % 6 === 0 ? "#9ca3af" : gridColor // Darker line every 6 hours
      ctx.lineWidth = hour % 6 === 0 ? 1.5 : 1
      ctx.beginPath()
      ctx.moveTo(x, headerHeight)
      ctx.lineTo(x, headerHeight + graphHeight)
      ctx.stroke()

      // Draw hour labels - show every hour
      if (hour < 24) {
        const displayHour = hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`
        ctx.fillStyle = textColor
        ctx.fillText(displayHour, x + timeWidth / 2, headerHeight + graphHeight + 20)
      }
    }

    ctx.textAlign = "left" // Reset text alignment

    // Draw footer
    ctx.fillStyle = "#f9fafb"
    ctx.fillRect(0, height - footerHeight, width, footerHeight)
  }

  const drawDutyStatusGraph = (ctx: CanvasRenderingContext2D, dutyLog: DutyStatus[], width: number, height: number) => {
    const headerHeight = 80
    const footerHeight = 60
    const graphHeight = height - headerHeight - footerHeight
    const leftMargin = 120
    const rightMargin = 20
    const graphWidth = width - leftMargin - rightMargin
    const timeWidth = graphWidth / 24

    // Map duty status to Y position
    const statusToY = (status: string): number => {
      switch (status) {
        case "off-duty":
          return headerHeight + graphHeight * 0.125
        case "sleeper":
          return headerHeight + graphHeight * 0.375
        case "driving":
          return headerHeight + graphHeight * 0.625
        case "on-duty":
          return headerHeight + graphHeight * 0.875
        default:
          return headerHeight + graphHeight * 0.125
      }
    }

    // Get color for duty status
    const statusToColor = (status: string): string => {
      switch (status) {
        case "off-duty":
          return "#10b981"
        case "sleeper":
          return "#3b82f6"
        case "driving":
          return "#f97316"
        case "on-duty":
          return "#8b5cf6"
        default:
          return "#6b7280"
      }
    }

    // Draw duty status line
    ctx.lineWidth = 3

    dutyLog.forEach((entry, index) => {
      const startHour = entry.startTime.getHours() + entry.startTime.getMinutes() / 60
      const endHour = entry.endTime.getHours() + entry.endTime.getMinutes() / 60
      const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour

      const startX = leftMargin + startHour * timeWidth
      const endX = leftMargin + adjustedEndHour * timeWidth
      const y = statusToY(entry.status)

      ctx.strokeStyle = statusToColor(entry.status)
      ctx.fillStyle = statusToColor(entry.status)

      // Draw horizontal line for this duty status
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()

      // Draw vertical transition line to next status
      if (index < dutyLog.length - 1) {
        const nextY = statusToY(dutyLog[index + 1].status)
        ctx.beginPath()
        ctx.moveTo(endX, y)
        ctx.lineTo(endX, nextY)
        ctx.stroke()
      }

      // Draw dots at transition points
      ctx.beginPath()
      ctx.arc(startX, y, 4, 0, Math.PI * 2)
      ctx.fill()

      if (index === dutyLog.length - 1) {
        ctx.beginPath()
        ctx.arc(endX, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = `eld-log-${date}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Electronic Logging Device (ELD) Record</h2>
            <p className="text-sm text-muted-foreground">DOT-compliant daily log sheet</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{date}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driver</p>
              <p className="font-semibold">{driverName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-3/10 rounded-lg">
              <Truck className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicle ID</p>
              <p className="font-semibold">{vehicleId}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Log Sheet Canvas */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Duty Status Graph</h3>
          <p className="text-sm text-muted-foreground">24-hour duty status visualization</p>
        </div>
        <div className="bg-white rounded-lg border-2 overflow-hidden">
          <canvas ref={canvasRef} width={1200} height={500} className="w-full" />
        </div>
      </Card>

      {/* Totals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#f97316]" />
              <p className="text-sm font-medium text-muted-foreground">Driving</p>
            </div>
            <p className="text-2xl font-bold">{totals.totalDriving} hrs</p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
              <p className="text-sm font-medium text-muted-foreground">On Duty</p>
            </div>
            <p className="text-2xl font-bold">{totals.totalOnDuty} hrs</p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              <p className="text-sm font-medium text-muted-foreground">Off Duty</p>
            </div>
            <p className="text-2xl font-bold">{totals.totalOffDuty} hrs</p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <p className="text-sm font-medium text-muted-foreground">Cycle Used</p>
            </div>
            <p className="text-2xl font-bold">{tripData.currentCycleUsed} hrs</p>
          </div>
        </div>
      </Card>

      {/* Duty Log Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Duty Log</h3>
        <div className="space-y-2">
          {dutyLog.map((entry, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              <Badge
                variant="secondary"
                className="min-w-[100px] justify-center"
                style={{
                  backgroundColor:
                    entry.status === "driving"
                      ? "#f97316"
                      : entry.status === "on-duty"
                        ? "#8b5cf6"
                        : entry.status === "sleeper"
                          ? "#3b82f6"
                          : "#10b981",
                  color: "white",
                }}
              >
                {entry.status.toUpperCase()}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{entry.location}</p>
                {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {entry.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} -{" "}
                  {entry.endTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
                <p className="text-xs text-muted-foreground">{entry.duration.toFixed(2)} hrs</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
