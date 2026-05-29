# StoleCheck

AI-powered stolen goods detection and prevention platform. Three-sided mobile app connecting theft victims, buyers, and law enforcement.

## Architecture

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo SDK 51, TypeScript, Expo Router, NativeWind, Zustand |
| Backend API | Node.js + Express + TypeScript, Prisma ORM, PostgreSQL |
| AI/ML Service | Python FastAPI, MobileNetV2 embeddings, cosine similarity matching |
| Auth | JWT with role-based access (VICTIM, BUYER, OFFICER, ADMIN) |
| Notifications | Expo Push Notifications |

## User Roles

- **Victims** register stolen items with photos, descriptions, and unique identifiers (hallmarks, VIN, IMEI, serial numbers)
- **Buyers** scan items before purchasing to check if they are stolen — get a Theft Probability Score (TPS)
- **Officers** receive real-time AI-triggered alerts with match details and case management

## Quick Start

### Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Backend API: http://localhost:3000
- ML Service: http://localhost:8000
- PostgreSQL: localhost:5432

### Manual Setup

**Backend:**
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

**ML Service:**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Mobile App:**
```bash
cd mobile
npm install
npx expo start
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account (name, email, password, role)
- `POST /api/auth/login` — Sign in
- `GET /api/auth/me` — Current user profile
- `POST /api/auth/push-token` — Register Expo push token

### Stolen Items (VICTIM)
- `POST /api/items/` — Register stolen item with photos
- `GET /api/items/mine` — List my stolen items
- `GET /api/items/:id` — Item detail
- `PATCH /api/items/:id/status` — Update status (ACTIVE/RECOVERED/CLOSED)

### Verification (BUYER)
- `POST /api/verify/image` — Scan photo for matches
- `POST /api/verify/id` — Check identifier (HALLMARK, VIN, IMEI, etc.)
- `GET /api/verify/search` — Search stolen items database

### Alerts (OFFICER)
- `GET /api/alerts/` — List alerts
- `GET /api/alerts/stats` — Dashboard statistics
- `GET /api/alerts/map` — Map data for alert locations
- `GET /api/alerts/:id` — Alert detail
- `PATCH /api/alerts/:id` — Update alert status

## Theft Probability Score (TPS)

Weighted composite score (0-100):
- Image similarity: 40%
- Identifier match: 35%
- Metadata match: 15%
- Context (recency): 10%

Bands: GREEN (<40) | AMBER (40-69) | RED (70+)

## Test Accounts

All passwords: `Test@1234`

| Email | Role |
|---|---|
| victim@test.com | VICTIM |
| buyer@test.com | BUYER |
| officer@test.com | OFFICER |
| admin@test.com | ADMIN |

## Project Structure

```
stolencheck/
├── mobile/          # React Native Expo app
├── backend/         # Express API server
├── ml-service/      # Python FastAPI ML microservice
├── docker-compose.yml
└── README.md
```
