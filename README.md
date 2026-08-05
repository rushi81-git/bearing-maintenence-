# AI-Driven Smart Workshop Maintenance System (v2.0)

> **ADCET, Ashta — TY BTech Mechanical Engineering Minor Project**  
> Guide: Ms. R.P. Mali

---

## What's New in v2.0

| Change | Details |
|---|---|
| ✅ MySQL Database | All machine records, parameters & predictions stored persistently |
| ✅ Delete Machine | Any added machine can be removed with full cascade deletion |
| ✅ Parameter Analysis | Tool Condition marked as EXCEPTION — excluded from scoring for non-CNC machines |
| ✅ REST API Backend | Node.js + Express backend decoupled from React frontend |

---
cls
## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Recharts, Lucide React |
| Backend | Node.js, Express 4 |
| Database | MySQL 8.x |
| ORM/Driver | mysql2 (promise-based) |

---

## Prerequisites

- Node.js v14+
- npm v6+
- MySQL 8.x (running locally or remote)

---

## Setup Instructions

### Step 1 — Database Setup

1. Open MySQL Workbench or terminal
2. Run the schema file:
   ```sql
   SOURCE path/to/backend/schema.sql;
   ```
   This creates the `workshop_maintenance` database with all tables and sample data.

### Step 2 — Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm start
```

Backend runs at: `http://localhost:5000`

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Parameter Analysis Summary

| Parameter | Unit | Required? | Weight | Reason |
|---|---|---|---|---|
| Vibration | mm/s | ✅ Required | 35% | Best single predictor — detects imbalance, misalignment, bearing wear |
| Temperature | °C | ✅ Required | 25% | Arrhenius law — every 10°C rise halves component life |
| Power Usage | kW | ✅ Required | 20% | Detects mechanical resistance, motor degradation, overload |
| Operational Hours | hrs | ✅ Required | 20% | Time-based wear aligns with manufacturer service intervals |
| Tool Condition | % | ⚠️ EXCEPTION | 0%* | Only for CNC/cutting machines. `NULL` for general equipment |

> *When tool_condition is present, it applies an adjustment of up to ±15% on the risk score.  
> When `NULL`, it is excluded entirely — no impact on prediction.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/machines` | All machines with latest params & prediction |
| POST | `/api/machines` | Add new machine |
| PUT | `/api/machines/:id/parameters` | Update parameters & re-run prediction |
| DELETE | `/api/machines/:id` | Delete machine (cascades) |
| GET | `/api/maintenance-schedule` | Pending maintenance sorted by priority |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/health` | Server health check |

---

## Project Structure

```
workshop-maintenance-system/
├── backend/
│   ├── server.js         ← Express API + AI prediction engine
│   ├── db.js             ← MySQL connection pool
│   ├── schema.sql        ← Database schema + seed data
│   ├── .env.example      ← Copy to .env and fill credentials
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js        ← Main React app (all tabs + modals)
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## Institution

**Annasaheb Dange College of Engineering and Technology, Ashta**  
Department of Mechanical Engineering  
Focus: Industry 4.0, Predictive Maintenance, AI/ML
