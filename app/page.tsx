"use client";
import HOSGraph from "@/components/hos-graph";
import {
  getCurrentPosition,
  getOSRMRoute,
  useDataStates,
  useOSRMRoute,
} from "./states";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Ban, Loader, Truck } from "lucide-react";
import MapSelector from "@/components/map-selector";
import { generateHOSPlanPerDay } from "@/lib/generateHOSPlan";
import { use, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Span } from "next/dist/trace";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const [data, setData] = useDataStates();
  const [drivingRoute, setDrivingRoute] = useState<any>();
  const [loadingRoute, setLoadingRoute] = useState<any>();

  const {
    route: routeToPickup,
    isLoading: isLoadingRouteToPickup,
    isValidating: isValidRouteToPickup,
    isError: isErrorRouteToPickup,
    refresh: refreshRouteToPickup,
  } = useOSRMRoute(data.current_location, data.pickup_location);

  const {
    route: routeToDropoff,
    isLoading: isLoadingRouteToDropoff,
    isValidating: isValidRouteToDropoff,
    isError: isErrorRouteToDropoff,
    refresh: refreshRouteToDropoff,
  } = useOSRMRoute(data.pickup_location, data.dropoff_location);

  const HOSPlan = useMemo(
    () =>
      generateHOSPlanPerDay(
        [
          { driveHours: routeToPickup?.duration ?? 0, loadHours: 1 },
          { driveHours: routeToDropoff?.duration ?? 0, unloadHours: 1 },
        ],
        parseInt(data.current_cycle_used)
      ),
    [data.current_cycle_used, drivingRoute, loadingRoute]
  );

  // console.log("[v0] HOSPlanEvents", HOSPlan);

  const statuses = [
    { id: "off-duty", label: "Off Duty", y: 1, color: "#64748b" },
    { id: "sleeper", label: "Sleeper Berth", y: 2, color: "#6366f1" },
    { id: "driving", label: "Driving", y: 3, color: "#14b8a6" },
    { id: "on-duty", label: "On Duty", y: 4, color: "#a855f7" },
  ];

  const cellWidth = 15;
  const cellHeight = 50;
  const labelWidth = 140;
  const gridWidth = 24 * 4 * cellWidth;

  const generateHourMarks = () => {
    const marks = [];
    for (let i = 0; i < 24; i++) {
      marks.push({
        hour: i,
        label:
          i === 0
            ? "12"
            : i <= 11
            ? i.toString()
            : i === 12
            ? "12"
            : (i - 12).toString(),
        period: i < 12 ? "AM" : "PM",
      });
    }
    return marks;
  };

  const hourMarks = generateHourMarks();

  const calculateTotals = () => {
    const totals: any = { "off-duty": 0, sleeper: 0, driving: 0, "on-duty": 0 };
    HOSPlan.perDay[0].events.forEach((event) => {
      const duration = event.endHour - event.startHour;
      totals[event.status] += duration;
    });
    return totals;
  };

  const totals = calculateTotals();

  const generateLinePoints = () => {
    const points: any = [];
    const sortedEvents = [...HOSPlan.perDay[0].events].sort(
      (a, b) => a.startHour - b.startHour
    );

    sortedEvents.forEach((event, index) => {
      const statusIndex = statuses.findIndex((s) => s.id === event.status);
      const yPos = cellHeight + statusIndex * cellHeight + cellHeight / 2;

      const startX = labelWidth + event.startHour * cellWidth * 4;
      points.push({ x: startX, y: yPos });

      const endX = labelWidth + event.endHour * cellWidth * 4;
      points.push({ x: endX, y: yPos });

      if (index < sortedEvents.length - 1) {
        const nextEvent = sortedEvents[index + 1];
        const nextStatusIndex = statuses.findIndex(
          (s) => s.id === nextEvent.status
        );
        const nextYPos =
          cellHeight + nextStatusIndex * cellHeight + cellHeight / 2;

        points.push({ x: endX, y: nextYPos });
      }
    });

    return points;
  };

  const linePoints = generateLinePoints();

  console.log(
    routeToPickup,
    isErrorRouteToPickup,
    routeToDropoff,
    "routeToPickup, routeToDropoff",
    data.pickup_location,
    data.dropoff_location,
    data.current_location,
    data.pickup_location
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-linear-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
            roadduty
          </h1>
          <p className="text-slate-600 text-lg">
            DOT-Compliant Driver Log Management
          </p>
        </div>
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <div className="space-y-8 p-4">
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-muted-foreground">
                  Enter your trip details. We'll generate your route and
                  DOT-compliant logs.
                </AlertDescription>
              </Alert>

              {/* Driver Info */}
              <section className="space-y-4">
                <div className="">
                  <Label htmlFor="driver" className="text-sm font-medium">
                    Driver Name
                  </Label>
                  <Input
                    id="driver"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ name: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>

                <div className="">
                  <Label htmlFor="vehicle" className="text-sm font-medium">
                    Vehicle ID *
                  </Label>
                  <Input
                    id="vehicle"
                    type="text"
                    value={data.vehicle_ID}
                    onChange={(v) => setData({ vehicle_ID: v.target.value })}
                    className="h-12 text-base"
                  />
                </div>

                <div className="">
                  <Label htmlFor="co-driver" className="text-sm font-medium">
                    Co-Driver (Optional)
                  </Label>
                  <Input
                    id="co-driver"
                    type="text"
                    value={data.co_driver_name}
                    onChange={(v) =>
                      setData({ co_driver_name: v.target.value })
                    }
                    className="h-12 text-base"
                  />
                </div>

                <div className="">
                  <Label htmlFor="main_office" className="text-sm font-medium">
                    Main Office Address
                  </Label>
                  <Input
                    type="text"
                    value={data.main_office}
                    onChange={(v) => setData({ main_office: v.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </section>

              {/* Current Location */}
              <section className="space-y-4">
                <div className="">
                  <Label
                    htmlFor="current-location"
                    className="text-sm font-medium"
                  >
                    Where are you now? (GPS) *
                  </Label>
                  <Input
                    id="current-location"
                    type="text"
                    value={data.current_location}
                    className="h-12 text-base"
                    disabled
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      getCurrentPosition().then(
                        ({ latitude, longitude }: any) => {
                          setData({
                            current_location: latitude + "," + longitude,
                          });
                        }
                      );
                    }}
                    className="gap-2"
                  >
                    Use current location
                  </Button>
                </div>
              </section>

              {/* Trip Route */}
              <section className="space-y-4">
                <div className="">
                  <Label htmlFor="pickup" className="text-sm font-medium">
                    Pickup Location (GPS) *
                  </Label>
                  <div className="">
                    <Input
                      id="pickup"
                      type="text"
                      value={data.pickup_location}
                      className="h-12 text-base"
                      disabled
                    />
                    <MapSelector
                      onLocationSelect={(coords) =>
                        setData({
                          pickup_location: coords.lat + "," + coords.lng,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dropoff" className="text-sm font-medium">
                    Dropoff Location (GPS) *
                  </Label>
                  <div className="">
                    <Input
                      id="dropoff"
                      type="text"
                      value={data.dropoff_location}
                      className="h-12 text-base"
                      disabled
                    />
                    <MapSelector
                      onLocationSelect={(coords) =>
                        setData({
                          dropoff_location: coords.lat + "," + coords.lng,
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Hours of Service */}
              <section className="space-y-4">
                <div className="">
                  <Label
                    htmlFor="current-cycle"
                    className="text-sm font-medium"
                  >
                    Current Cycle Used (Hours)
                  </Label>
                  <Input
                    id="current-cycle"
                    type="number"
                    value={data.current_cycle_used}
                    onChange={(v) =>
                      setData({ current_cycle_used: v.target.value })
                    }
                    className="h-12 text-base"
                  />
                </div>
              </section>
            </div>{" "}
          </CardContent>
        </Card>

        <div className="w-full p-6  ">
          <div className="bg-white rounded-2xl shadow-sm border-slate-200 overflow-hidden mb-6">
            <div className=" p-6  flex items-center justify-between">
              <h1 className="text-2xl font-bold mb-1">Driver's Daily Log</h1>
              <p className="text-sm">
                Hours of Service Record - 24 Hour Period
              </p>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  refreshRouteToDropoff();
                  refreshRouteToPickup();
                }}
              >
                Refresh
                {(isValidRouteToDropoff ||
                  isLoadingRouteToDropoff ||
                  isValidRouteToPickup ||
                  isLoadingRouteToPickup) && (
                  <Loader className="animate-spin h-4 w-4 text-slate-500" />
                )}
              </Button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Date
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-500">Month</div>
                    <div className="text-xl font-bold text-slate-900">
                      {new Date().toLocaleDateString("en-US", {
                        month: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-500">Day</div>
                    <div className="text-xl font-bold text-slate-900">
                      {new Date().toLocaleDateString("en-US", {
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-500">Year</div>
                    <div className="text-xl font-bold text-slate-900">
                      {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  Total Miles Today{" "}
                  {(isValidRouteToDropoff ||
                    isLoadingRouteToDropoff ||
                    isValidRouteToPickup ||
                    isLoadingRouteToPickup) && (
                    <Loader className="animate-spin h-4 w-4 text-slate-500" />
                  )}
                  {isErrorRouteToDropoff ||
                    (isErrorRouteToPickup && (
                      <Badge variant={"destructive"}>Error</Badge>
                    ))}
                </label>

                <div className=" from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="text-4xl font-bold text-slate-700">
                    {(
                      (routeToPickup?.distance ?? 0) * 0.621371 +
                      (routeToDropoff?.distance ?? 0) * 0.621371
                    ).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    miles driven
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Vehicle Number
                </label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-lg font-semibold text-slate-900">
                    {data.vehicle_ID}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Carrier Information
                </label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900">
                    Carrier Name: {data.name}
                  </div>
                  {/* <div className="text-sm text-slate-600 h-4">
                    Carrier Signature:
                  </div> */}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Driver Information
                </label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900">
                    MAIN OFFICE ADDRESS: {data.main_office}
                  </div>
                  {data.co_driver_name && (
                    <div className="text-md text-slate-600">
                      Co-Driver: {data.co_driver_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <svg
                width={labelWidth + gridWidth + 2}
                height={cellHeight * 5}
                className="bg-white"
              >
                <g>
                  <rect
                    x="0"
                    y="0"
                    width={labelWidth}
                    height={cellHeight}
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={labelWidth / 2}
                    y={cellHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#475569"
                  >
                    Midnight
                  </text>

                  {hourMarks.map((mark, i) => (
                    <g key={`top-${i}`}>
                      <rect
                        x={labelWidth + i * cellWidth * 4}
                        y="0"
                        width={cellWidth * 4}
                        height={cellHeight}
                        fill={i % 2 === 0 ? "#ffffff" : "#f8fafc"}
                        stroke="#e2e8f0"
                        strokeWidth="0.5"
                      />
                      <text
                        x={labelWidth + i * cellWidth * 4 + cellWidth * 2}
                        y={cellHeight / 2 - 6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#1e293b"
                      >
                        {mark.label}
                      </text>
                      <text
                        x={labelWidth + i * cellWidth * 4 + cellWidth * 2}
                        y={cellHeight / 2 + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fill="#64748b"
                      >
                        {mark.period}
                      </text>
                    </g>
                  ))}
                </g>

                {statuses.map((status, rowIdx) => (
                  <g key={status.id}>
                    <rect
                      x="0"
                      y={cellHeight + rowIdx * cellHeight}
                      width={labelWidth}
                      height={cellHeight}
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <rect
                      x="8"
                      y={cellHeight + rowIdx * cellHeight + 12}
                      width="4"
                      height={cellHeight - 24}
                      fill={status.color}
                      rx="2"
                    />
                    <text
                      x={20}
                      y={cellHeight + rowIdx * cellHeight + cellHeight / 2}
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#475569"
                    >
                      {status.label}
                    </text>

                    {Array.from({ length: 96 }, (_, i) => (
                      <line
                        key={`vline-${status.id}-${i}`}
                        x1={labelWidth + i * cellWidth}
                        y1={cellHeight + rowIdx * cellHeight}
                        x2={labelWidth + i * cellWidth}
                        y2={cellHeight + (rowIdx + 1) * cellHeight}
                        stroke={i % 4 === 0 ? "#cbd5e1" : "#e2e8f0"}
                        strokeWidth={i % 4 === 0 ? "1" : "0.5"}
                        opacity={i % 4 === 0 ? "0.8" : "0.4"}
                      />
                    ))}

                    <line
                      x1={labelWidth}
                      y1={cellHeight + (rowIdx + 1) * cellHeight}
                      x2={labelWidth + gridWidth}
                      y2={cellHeight + (rowIdx + 1) * cellHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {linePoints.length > 0 && (
                  <g>
                    <polyline
                      points={linePoints
                        .map((p: any) => `${p.x},${p.y + 2}`)
                        .join(" ")}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.1"
                    />

                    <polyline
                      points={linePoints
                        .map((p: any) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {linePoints.map((point: any, idx: any) => {
                      if (idx % 2 === 0 || idx === linePoints.length - 1) {
                        const eventIndex = Math.floor(idx / 2);
                        const event =
                          HOSPlan.perDay[0].events[
                            Math.min(
                              eventIndex,
                              HOSPlan.perDay[0].events.length - 1
                            )
                          ];
                        const status: any = statuses.find(
                          (s) => s.id === event.status
                        );

                        return (
                          <g key={`point-${idx}`}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="5"
                              fill="white"
                              stroke={status.color}
                              strokeWidth="2.5"
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="2.5"
                              fill={status.color}
                            />
                          </g>
                        );
                      }
                      return null;
                    })}
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm  border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Total Hours Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className=" from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      {status.label}
                    </span>
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: status.color }}
                  >
                    {totals[status.id].toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">hours</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
              Remarks
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Shipping Document:</span>
                <span className="font-semibold text-slate-900">
                  {data.shipping_docs}
                </span>
              </div>
              <p className="text-slate-700">{data.remarks}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
