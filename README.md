# CampusPulse 🏫

A full-stack **Campus Incident Management System** built with the MERN stack, enabling students and faculty to report campus issues, with automated smart assignment, real-time communication, SLA enforcement, and role-based access control across 5 hierarchical roles.

<br/>

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Incident Lifecycle](#incident-lifecycle)
- [Real-Time Communication](#real-time-communication)
- [SLA Enforcement](#sla-enforcement)
- [Project Structure](#project-structure)

<br/>

## Features

- **Smart Auto-Assignment** — Workload-based algorithm automatically assigns incidents to the least-busy staff member in the matching department
- **Real-Time Chat** — Per-incident chat rooms powered by Socket.IO for instant communication between reporters and assigned staff
- **SLA Enforcement** — Node-Cron watchdog escalates overdue tickets and reminds stagnant staff automatically every 30 minutes
- **Image Verification** — Cloudinary-backed before/after photo proof required for incident resolution — no photo, no close
- **5-Level RBAC** — Hierarchical Role-Based Access Control across Student, Faculty, Maintenance, Security, HOD, and Admin
- **Geo-Fenced Panic Alerts** — One-tap emergency alert creates a Critical-priority Security incident with the user's GPS coordinates
- **JWT Auth with Refresh Tokens** — Short-lived access tokens (15m) + long-lived refresh tokens (7d) with DB-backed revocation
- **Soft Deletion** — Users are never hard-deleted, preserving all incident history and reference integrity
- **Admin Dashboard** — Aggregated stats, department performance metrics, user management, and system-wide announcements

<br/>

## Tech Stack

**Backend**
| Package | Version | Purpose |
|---|---|---|
| Node.js + Express | ^5.2.1 | REST API server |
| MongoDB + Mongoose | ^9.1.2 | Database & ODM |
| Socket.IO | ^4.8.3 | Real-time WebSocket communication |
| node-cron | ^4.2.1 | Scheduled SLA enforcement jobs |
| jsonwebtoken | ^9.0.3 | Access & refresh token auth |
| bcryptjs | ^3.0.3 | Password hashing (salt rounds: 10) |
| Cloudinary + Multer | ^1.41.3 | Cloud image storage & upload middleware |
| dotenv | ^17.2.3 | Environment variable management |
| cors | ^2.8.6 | Cross-origin request handling |

**Frontend**
| Package | Version | Purpose |
|---|---|---|
| React | ^19.2.0 | UI library |
| Redux Toolkit + React-Redux | ^2.11.2 | Global state management |
| React Router DOM | ^7.13.0 | Client-side routing |
| Axios | ^1.13.4 | HTTP client with interceptors |
| Socket.IO Client | ^4.8.3 | WebSocket connection |
| React Leaflet + Leaflet | ^1.9.4 | Interactive campus map |
| Tailwind CSS | ^4.1.18 | Utility-first styling |
| jwt-decode | ^4.0.0 | Client-side token hydration |
| React Toastify | ^11.0.5 | Notifications |
| Vite | ^7.2.4 | Build tool |

<br/>

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│  Redux Store ─ Axios Instance ─ Socket.IO Client   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────────────┐
│              Express + HTTP Server                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  Routes  │  │  Middleware│  │   Socket.IO Server│ │
│  │ /api/... │  │  protect()│  │   (Rooms per      │ │
│  │          │  │authorize()│  │    incident ID)   │ │
│  └────┬─────┘  └──────────┘  └───────────────────┘ │
│       │                                             │
│  ┌────▼──────────────────────────────────────────┐  │
│  │              Controllers                       │  │
│  │  authController  incidentController            │  │
│  │  adminController deptController staffController│  │
│  └────┬──────────────────────────────────────────┘  │
│       │                              │               │
│  ┌────▼───────┐              ┌───────▼─────────┐    │
│  │  MongoDB   │              │   Cloudinary    │    │
│  │  Mongoose  │              │   CDN (images)  │    │
│  └────────────┘              └─────────────────┘    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Node-Cron  (runs every 30 min)              │   │
│  │  • Escalates OPEN tickets > 2 hours          │   │
│  │  • Reminds stagnant IN_PROGRESS > 2 days     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

<br/>

## Role-Based Access Control

| Role | Report | View Own | Resolve | Reassign | Manage Users | Map View |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Student** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Faculty** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Maintenance** | ❌ | Assigned only | ✅ + photo | ❌ | ❌ | ❌ |
| **Security** | ❌ | Security incidents | ✅ + photo | ❌ | ❌ | ✅ |
| **HOD** | ❌ | Department | ❌ | Own dept only | Add staff | ❌ |
| **Admin** | ❌ | All | ❌ | ✅ | Full CRUD | ✅ |

Authorization is enforced at two levels:
- **Middleware level** — `authorize('Role1', 'Role2')` on routes
- **Controller level** — ownership and department-scope checks on data operations

<br/>

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier works)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/campuspulse.git
cd campuspulse
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Set up environment variables**

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below).

**5. Run the backend**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**6. Run the frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

<br/>

## Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/CampusPulse

# JWT
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

**Frontend environment** — create `.env` in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

<br/>

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user |
| POST | `/login` | Public | Login → returns access + refresh tokens |
| POST | `/refresh` | Public | Exchange refresh token for new access token |
| POST | `/add-staff` | HOD | Create a staff account in HOD's department |

### Incidents — `/api/incidents`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Report incident + upload before-fix images |
| GET | `/my-incidents` | Student | Get incidents reported by current user |
| GET | `/my-tasks` | Maintenance, Security | Get tasks assigned to current user |
| GET | `/map-data` | Security, Admin | Active security incidents with GPS coords |
| PATCH | `/:id/status` | Maintenance, Security | Update status (RESOLVED requires after-fix photo) |
| PATCH | `/:id/rate` | Student | Rate resolved incident (< 2 stars = REOPEN) |
| PUT | `/reassign/:id` | HOD, Admin | Reassign to next available staff |
| POST | `/panic` | Authenticated | Trigger geo-fenced emergency alert |
| POST | `/:id/comment` | Reporter + Assigned Staff | Add comment → real-time Socket.IO push |

### Departments — `/api/departments`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List all departments |
| POST | `/` | Admin | Create a department |
| PUT | `/:id/assign-hod` | Admin | Assign HOD (auto-demotes previous HOD) |
| GET | `/hod/dashboard` | HOD | Department analytics and staff workload |

### Admin — `/api/admin` *(all routes require Admin role)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | System-wide dashboard stats via aggregation |
| GET | `/users` | All users with search and filter |
| DELETE | `/users/:id` | Delete user |
| GET | `/incidents` | All incidents with search, filter, pagination |
| DELETE | `/incidents/:id` | Delete incident |
| POST | `/announcements` | Broadcast announcement to all users |
| GET | `/announcements` | Get all active announcements |

### Staff — `/api/staff`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | Maintenance | Personal stats: completed today, avg rating, active tasks |

<br/>

## Incident Lifecycle

```
[Student Reports]
      │
      ▼
   OPEN ──── Auto-Assignment Algorithm ────► Assigned to least-busy staff
      │             (category → department → lowest activeTasks)
      │
      │  [SLA: 2 hours pass, still OPEN]
      ├──────────────────────────────────► isEscalated = true, priority = High
      │
      ▼  [Staff claims task]
  IN_PROGRESS
      │
      │  [SLA: 2 days no update]
      ├──────────────────────────────────► System reminder comment added
      │
      ▼  [Staff uploads after-fix photo]
  RESOLVED
      │
      ▼  [Student rates]
      ├── Rating ≥ 2 ──────────────────► Ticket closed ✅
      └── Rating < 2 ──────────────────► REOPENED (staff activeTasks + 1)
```

<br/>

## Real-Time Communication

Socket.IO powers per-incident chat using a **room-per-incident** pattern.

**How it works:**
1. When a user opens an incident's chat, the client emits `join_incident` with the incident's MongoDB `_id`
2. The socket joins a room named after that ID
3. When any participant posts a comment via `POST /api/incidents/:id/comment`, the controller saves it to MongoDB and immediately emits `receive_comment` to everyone in that room
4. All connected clients in the room receive the message in real time

```
Client A ──emit('join_incident', '677abc')──► Room '677abc'
Client B ──emit('join_incident', '677abc')──► Room '677abc'

POST /comment ──► DB save ──► io.to('677abc').emit('receive_comment', comment)
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                          Client A          Client B
                        (instant update)  (instant update)
```

<br/>

## SLA Enforcement

A Node-Cron job runs every **30 minutes** and performs two checks:

**Check 1 — Escalate stale OPEN tickets**
- Finds all `OPEN` incidents created more than **2 hours ago** with `isEscalated: false`
- Bulk updates them: `isEscalated = true`, `priority = 'High'`

**Check 2 — Remind stagnant IN_PROGRESS tickets**
- Finds all `IN_PROGRESS` incidents where `updatedAt` is older than **2 days**
- Appends a system reminder comment to each ticket
- The `save()` call refreshes `updatedAt`, resetting the 2-day clock (prevents repeat spam)

```js
// Cron schedule: every 30 minutes
cron.schedule('*/30 * * * *', async () => { ... });
```

<br/>

## Project Structure

```
campuspulse/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cloudinary.js         # Multer + Cloudinary storage setup
│   ├── controllers/
│   │   ├── authController.js     # Register, login, refresh, add-staff
│   │   ├── incidentController.js # Full incident lifecycle + panic + chat
│   │   ├── adminController.js    # Stats, user/incident management, announcements
│   │   ├── deptController.js     # Department CRUD, HOD assignment, dashboard
│   │   └── staffController.js    # Staff personal stats
│   ├── middleware/
│   │   └── authMiddleware.js     # protect() + authorize() middleware
│   ├── models/
│   │   ├── User.js               # Schema with bcrypt pre-save hook
│   │   ├── Incident.js           # GeoJSON location, embedded comments, 2dsphere index
│   │   ├── Department.js         # Department with HOD reference
│   │   └── Announcement.js       # System-wide announcements
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── incidentRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── deptRoutes.js
│   │   └── staffRoutes.js
│   ├── utils/
│   │   ├── generateToken.js      # Access (15m) + Refresh (7d) token generators
│   │   └── cronJobs.js           # SLA watchdog cron
│   ├── server.js                 # Entry point: Express, Socket.IO, Cron bootstrap
│   ├── package.json
│   └── .env                      # ← never commit this
│
└── frontend/
    ├── src/
    │   ├── features/
    │   │   └── auth/
    │   │       └── authSlice.js  # Redux slice: login thunk, token hydration, logout
    │   ├── utils/
    │   │   └── axiosInstance.js  # Axios with Bearer token request interceptor
    │   ├── pages/                # Role-specific dashboard pages
    │   ├── components/           # ChatInterface, ReportIncidentForm, Map, etc.
    │   ├── store.js              # Redux store
    │   └── main.jsx              # React entry point
    ├── package.json
    └── vite.config.js
```

<br/>

## Key Design Decisions

**Why Socket.IO over plain WebSockets?**
Socket.IO provides named events, automatic reconnection, HTTP long-polling fallback, and most importantly — **rooms**. The per-incident room pattern means a student only receives real-time updates for their own incident, not everyone else's.

**Why embedded comments instead of a separate collection?**
Comments are always fetched with the incident — there's no use case for querying all comments across all incidents independently. Embedding eliminates an extra DB round-trip and matches the access pattern perfectly.

**Why soft-delete users?**
Hard-deleting a user would leave all their incident references pointing to a non-existent document. Soft deletion (`isDeleted: true`) preserves referential integrity while hiding the user from the assignment algorithm and admin views.

**Why store the refresh token in the database?**
A purely stateless JWT can never be revoked — once issued, it's valid until expiry. Storing it in MongoDB allows logout to invalidate the token immediately by clearing the field, and prevents replay attacks with old tokens.

<br/>

## Screenshots

> *Frontend is currently in development. Screenshots will be added upon completion.*

<br/>

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

<br/>

## License

[MIT](LICENSE)
