"use client";

import { generateHOSPlanPerDay } from "@/lib/generateHOSPlan";
import { useState } from "react";

const HOSGraph = () => {
  const HOSPlanPerDay = generateHOSPlanPerDay(
    [
      { driveHours: 1, loadHours: 1 },
      { driveHours: 13, unloadHours: 1 },
    ],
    24
  );

  const [logData] = useState({
    date: { month: "10", day: "20", year: "2025" },
    totalMiles: "450",
    vehicleNumbers: "Truck #1234",
    carrierName: "ABC Transport Inc.",
    mainOffice: "123 Main St, City, State",
    driverName: "John Doe",
    coDriverName: "",
    totalHours: "11",
    shippingDocs: "PRO #98765",
    remarks: "Regular delivery route",

    events: HOSPlanPerDay.perDay[0].events,

    // events: [
    //   { status: "sleeper", startHour: 0, endHour: 6.5 },
    //   { status: "on-duty", startHour: 7, endHour: 7.5 },
    //   { status: "driving", startHour: 7.5, endHour: 12 },
    //   { status: "off-duty", startHour: 12, endHour: 13 },
    //   { status: "driving", startHour: 13, endHour: 17.5 },
    //   { status: "on-duty", startHour: 17.5, endHour: 18 },
    //   { status: "off-duty", startHour: 18, endHour: 24 },
    // ],
  });

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
    logData.events.forEach((event) => {
      const duration = event.endHour - event.startHour;
      totals[event.status] += duration;
    });
    return totals;
  };

  const totals = calculateTotals();

  const generateLinePoints = () => {
    const points: any = [];
    const sortedEvents = [...logData.events].sort(
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

  return (
    <div className="w-full p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Driver's Daily Log</h1>
          <p className="text-slate-200 text-sm">
            Hours of Service Record - 24 Hour Period
          </p>
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
                  {logData.date.month}
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500">Day</div>
                <div className="text-xl font-bold text-slate-900">
                  {logData.date.day}
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500">Year</div>
                <div className="text-xl font-bold text-slate-900">
                  {logData.date.year}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Total Miles Today
            </label>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
              <div className="text-4xl font-bold text-slate-700">
                {logData.totalMiles}
              </div>
              <div className="text-xs text-slate-600 mt-1">miles driven</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Vehicle Number
            </label>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-lg font-semibold text-slate-900">
                {logData.vehicleNumbers}
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
                {logData.carrierName}
              </div>
              <div className="text-sm text-slate-600">{logData.mainOffice}</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Driver Information
            </label>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900">
                {logData.driverName}
              </div>
              {logData.coDriverName && (
                <div className="text-sm text-slate-600">
                  Co-Driver: {logData.coDriverName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-6 justify-center">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-sm font-medium text-slate-700">
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
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
                  points={linePoints.map((p: any) => `${p.x},${p.y}`).join(" ")}
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
                      logData.events[
                        Math.min(eventIndex, logData.events.length - 1)
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

      <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Total Hours Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200"
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

      <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
          Remarks
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Shipping Document:</span>
            <span className="font-semibold text-slate-900">
              {logData.shippingDocs}
            </span>
          </div>
          <p className="text-slate-700">{logData.remarks}</p>
        </div>
      </div>
    </div>
  );
};

export default HOSGraph;
