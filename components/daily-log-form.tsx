"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

interface TimeSlot {
  hour: number
  offDuty: boolean
  sleeperBerth: boolean
  driving: boolean
  onDuty: boolean
}

interface DailyLogFormProps {
  tripData: {
    date: string
    carrierName: string
    carrierAddress: string
    coDriverName: string
    vehicleNumber: string
    trailerNumber: string
    totalMiles: string
    shippingNumber: string
    loadingLocation: string
    unloadingLocation: string
    startTime: string
    remarks: string
  }
}

export function DailyLogForm({ tripData }: DailyLogFormProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return { month, day, year }
  }

  const { month, day, year } = formatDate(tripData.date)

  const calculateTotalHours = () => {
    // This is a simplified calculation - in a real app, this would be based on actual time entries
    return "11"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            {"DRIVER'S DAILY LOG"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{"(ONE CALENDAR DAY — 24 HOURS)"}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{"U.S. DEPARTMENT OF TRANSPORTATION"}</p>
          <p className="text-xs text-muted-foreground">{"ORIGINAL — Submit to carrier within 13 days"}</p>
          <p className="text-xs text-muted-foreground">{"DUPLICATE — Driver retains possession for eight days"}</p>
        </div>
      </div>

      {/* Header Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">{"Date"}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input value={month} readOnly className="text-center font-mono" />
                  <p className="text-xs text-center text-muted-foreground mt-1">{"(MONTH)"}</p>
                </div>
                <div className="flex-1">
                  <Input value={day} readOnly className="text-center font-mono" />
                  <p className="text-xs text-center text-muted-foreground mt-1">{"(DAY)"}</p>
                </div>
                <div className="flex-1">
                  <Input value={year} readOnly className="text-center font-mono" />
                  <p className="text-xs text-center text-muted-foreground mt-1">{"(YEAR)"}</p>
                </div>
              </div>
            </div>

            {/* Total Miles */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">{"Total miles driving today"}</Label>
              <Input value={tripData.totalMiles} readOnly className="text-center text-lg font-semibold" />
            </div>

            {/* Vehicle Numbers */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">{"Truck or tractor and trailer number"}</Label>
              <Input value={`${tripData.vehicleNumber} / ${tripData.trailerNumber}`} readOnly />
              <p className="text-xs text-muted-foreground">{"VEHICLE NUMBERS—(SHOW EACH UNIT)"}</p>
            </div>
          </div>

          {/* Carrier Information */}
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">{"Name of carrier or carriers"}</Label>
              <Input value={tripData.carrierName} readOnly />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">{"Main office address"}</Label>
              <Input value={tripData.carrierAddress} readOnly />
            </div>
          </div>

          {/* Certification */}
          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground mb-4">
              {"I certify that these entries are true and correct"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">{"Driver's signature in full"}</Label>
                <div className="border-b-2 border-foreground/20 h-12 flex items-end pb-2">
                  <span className="text-lg italic text-muted-foreground">{"[Signature électronique]"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">{"Name of co-driver"}</Label>
                <Input value={tripData.coDriverName || "N/A"} readOnly />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 24-Hour Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {"24-Hour Period Starting Time: "}
            {tripData.startTime}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Grid Header */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px] border border-border">
                {/* Time labels - Midnight row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted">{"Midnight"}</div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`hour-top-${i}`} className="border-r border-border p-1 text-center text-xs">
                      {i === 0 ? "12" : i <= 11 ? i : i === 12 ? "12" : i - 12}
                    </div>
                  ))}
                </div>

                {/* Off Duty Row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted flex items-center">
                    {"Off Duty"}
                  </div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`off-${i}`} className="border-r border-border h-12 bg-background" />
                  ))}
                </div>

                {/* Sleeper Berth Row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted flex items-center">
                    {"Sleeper Berth"}
                  </div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`sleeper-${i}`} className="border-r border-border h-12 bg-background" />
                  ))}
                </div>

                {/* Driving Row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted flex items-center">
                    {"Driving"}
                  </div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`driving-${i}`} className="border-r border-border h-12 bg-background" />
                  ))}
                </div>

                {/* On Duty Row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted flex items-center">
                    {"On Duty"}
                    <br />
                    {"(Not Driving)"}
                  </div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`onduty-${i}`} className="border-r border-border h-12 bg-background" />
                  ))}
                </div>

                {/* Noon label row */}
                <div className="grid grid-cols-[140px_repeat(24,1fr)] border-b border-border">
                  <div className="border-r border-border p-2 text-xs font-semibold bg-muted">{"Noon"}</div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={`hour-bottom-${i}`} className="border-r border-border p-1 text-center text-xs">
                      {i === 11 ? "11" : i === 12 ? "12" : i === 23 ? "11" : ""}
                    </div>
                  ))}
                </div>

                {/* Total Hours */}
                <div className="grid grid-cols-[140px_1fr] bg-muted/50">
                  <div className="border-r border-border p-2 text-xs font-semibold" />
                  <div className="p-2 flex items-center justify-end gap-4">
                    <span className="text-xs font-semibold uppercase">{"Total Hours:"}</span>
                    <Input value={calculateTotalHours()} readOnly className="w-20 text-center" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              {
                "Note: Dans une application complète, les heures seraient calculées automatiquement selon les règles HOS et affichées graphiquement dans la grille ci-dessus."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remarks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{"Remarks"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase">
              {"Shipping documents number(s) or name of shipper and commodity"}
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{"Pro or Shipping No.:"}</span>
                <Input value={tripData.shippingNumber || "N/A"} readOnly className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{"Loading Location:"}</span>
                <Input value={tripData.loadingLocation} readOnly className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{"Unloading Location:"}</span>
                <Input value={tripData.unloadingLocation} readOnly className="flex-1" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase">{"Additional Remarks"}</Label>
            <Textarea value={tripData.remarks || "N/A"} readOnly rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          {
            "📋 Ce journal de bord a été généré automatiquement conformément aux normes HOS (Hours of Service) du DOT. Page 15 / 27"
          }
        </p>
      </div>
    </div>
  )
}
