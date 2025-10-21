# 🚛 RoadDuty — Intelligent Hours of Service Planning Engine

**RoadDuty** is a modern TypeScript engine that automatically **simulates, validates, and generates** compliant schedules for truck drivers based on the **FMCSA Hours of Service (HOS)** regulations.

It models real-world logistics operations — including driving, loading, resting, and on-duty periods — while ensuring full compliance with U.S. law.  
Built with **Next.js**, **React**, and **Nuqs**, it powers both backend automation and real-time visual dashboards for fleets, dispatchers, and drivers.

---

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

---

## ✨ Features

✅ Fully compliant with FMCSA HOS regulations  
✅ Generates **realistic, day-by-day schedules** (24-hour segments)  
✅ Enforces:
- 14-hour service window  
- 11-hour driving limit  
- 30-minute break after 8 hours continuous driving  
- 10-hour rest after each duty window  
- 70-hour / 8-day cumulative cycle  
✅ Handles **multi-leg trips** (multiple deliveries in one plan)  
✅ Auto-inserts breaks, rest, and restart periods  
✅ Returns **clear notes** and **cycle usage summaries**  
✅ 100% written in **TypeScript**, ready for production

---

## 🧠 HOS Rules Summary

| Rule | Description |
|------|--------------|
| **11 hours driving** | Max driving time per 14-hour duty window |
| **14-hour window** | Total on-duty time before a mandatory 10-hour rest |
| **30-minute break** | Required after 8h of driving without interruption |
| **10-hour rest** | Mandatory rest after duty completion |
| **70-hour / 8-day cycle** | Max work hours over any 8 consecutive days |
| **34-hour restart** | Resets the 8-day cycle after 34h off-duty |

