# GoTutor.ai — Backend

REST API server for GoTutor.ai, an AI-powered tutoring platform. Built with **Express 5**, **TypeScript**, and **Supabase**.

## Tech Stack

| Layer           | Technology                   |
| --------------- | ---------------------------- |
| Runtime         | Node.js                      |
| Language        | TypeScript 6                 |
| Framework       | Express 5                    |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Dev Runner      | tsx (watch mode)              |

## Project Structure

```
backend/
├── index.ts            # Express app setup, CORS, route mounting, server start
├── db.ts               # Supabase client initialization & TypeScript interfaces
├── routes/
│   ├── auth.ts             # User registration (sync-user) & profile retrieval
│   ├── classes.ts          # Class CRUD, membership, and roster queries
│   └── conversations.ts   # Fetch conversations for a user within a class
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- A `.env` file in the **project root** (one level above `backend/`) with the variables listed below

### Environment Variables

The backend reads its environment from `../.env` (the project root). Required variables:

| Variable                        | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL                     |
| `VITE_SUPABASE_SERVICE_ROLE_KEY`| Supabase service-role key (bypasses RLS)       |
| `VITE_FRONTEND_URL`             | Frontend origin for CORS (e.g. `http://localhost:5173`) |

### Install & Run

```bash
cd backend
npm install

# Development (hot-reload via tsx watch)
npm run dev

# Production
npm start
```

The server starts on **port 3000** by default.

## Database Schema (Supabase)

The backend interacts with the following Supabase tables:

### `User`

| Column          | Type     | Notes             |
| --------------- | -------- | ----------------- |
| `user_id`       | `string` | PK, matches Supabase Auth UID |
| `email`         | `string` | Unique            |
| `name`          | `string` |                   |
| `date_of_birth` | `string` |                   |

### `Class`

| Column     | Type     | Notes |
| ---------- | -------- | ----- |
| `class_id` | `number` | PK    |
| `name`     | `string` |       |

### `UserClass`

| Column     | Type     | Notes                                  |
| ---------- | -------- | -------------------------------------- |
| `user_id`  | `string` | FK → `User`                           |
| `class_id` | `number` | FK → `Class`                          |
| `role`     | `string` | `"supervisor"` or `"student"`          |

*Composite unique constraint on `(user_id, class_id)`.*

### `Conversation`

| Column            | Type     | Notes        |
| ----------------- | -------- | ------------ |
| `conversation_id` | `number` | PK           |
| `student_id`      | `number` | FK → `User`  |
| `class_id`        | `number` | FK → `Class` |
| `started_at`      | `string` | Timestamp    |

### `Message`

| Column            | Type     | Notes                         |
| ----------------- | -------- | ----------------------------- |
| `id`              | `number` | PK                            |
| `conversation_id` | `number` | FK → `Conversation`           |
| `role`            | `string` | `"user"` or `"assistant"`     |
| `content`         | `string` |                               |
| `timestamp`       | `string` |                               |

## API Reference

All endpoints require a `Bearer` token in the `Authorization` header (Supabase Auth JWT).

---

### Auth — `/auth`

#### `POST /auth/sync-user`

Creates or links a user profile after signup. Enforces a **minimum age of 13** — underage accounts are deleted immediately.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "date_of_birth": "2005-03-15"
}
```

**Responses:**

| Status | Description |
| ------ | ----------- |
| `200`  | User profile created/synced — returns the user row |
| `400`  | Invalid date of birth |
| `401`  | Missing or invalid token |
| `403`  | User is under 13 (account deleted) |
| `409`  | Duplicate email conflict |
| `500`  | Server error |

---

#### `GET /auth/me`

Returns the authenticated user's profile, including a computed `isAdult` boolean (age ≥ 18).

**Response (200):**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "date_of_birth": "2005-03-15",
  "isAdult": true
}
```

| Status | Description |
| ------ | ----------- |
| `200`  | Profile data |
| `401`  | Missing or invalid token |
| `404`  | Profile not found in database |

---

### Classes — `/classes`

#### `POST /classes/create-class`

Creates a new class.

**Request Body:**

```json
{
  "name": "Intro to Calculus"
}
```

| Status | Description |
| ------ | ----------- |
| `201`  | Class created — returns the class row |
| `400`  | Class name is required |
| `401`  | Missing or invalid token |
| `500`  | Server error |

---

#### `GET /classes/get-classes`

Returns all classes the authenticated user belongs to, including their role and the supervisor's name for each class.

**Response (200):**

```json
[
  {
    "class_id": 1,
    "role": "student",
    "name": "Intro to Calculus",
    "supervisor": "Prof. Smith"
  }
]
```

| Status | Description |
| ------ | ----------- |
| `200`  | Array of classes (may be empty) |
| `401`  | Missing or invalid token |
| `500`  | Server error |

---

#### `GET /classes/get-class/:id`

Returns detailed info for a single class, including its full member roster (supervisors and students). **Requires class membership** — non-members receive a `403`.

**Response (200):**

```json
{
  "class_id": "1",
  "name": "Intro to Calculus",
  "supervisors": [
    { "user_id": "abc-123", "name": "Prof. Smith", "email": "smith@univ.edu" }
  ],
  "students": [
    { "user_id": "def-456", "name": "Jane Doe", "email": "jane@example.com" }
  ]
}
```

| Status | Description |
| ------ | ----------- |
| `200`  | Class details with roster |
| `401`  | Missing or invalid token |
| `403`  | User is not a member of this class |
| `404`  | Class not found |
| `500`  | Server error |

---

#### `POST /classes/add-user-to-class`

Adds the authenticated user to a class with a given role. Uses upsert with `ignoreDuplicates` so re-joining is a no-op.

**Request Body:**

```json
{
  "class_id": 1,
  "role": "student"
}
```

| Status | Description |
| ------ | ----------- |
| `201`  | User added — returns the `UserClass` row |
| `400`  | Missing `class_id` or invalid `role` (must be `supervisor` or `student`) |
| `401`  | Missing or invalid token |
| `500`  | Server error |

---

### Conversations — `/conversations`

#### `GET /conversations?class_id=<id>`

Returns all conversations for the authenticated user within a specific class.

**Query Parameters:**

| Param      | Type     | Required | Description        |
| ---------- | -------- | -------- | ------------------ |
| `class_id` | `number` | Yes      | The class to filter by |

**Response (200):**

```json
[
  {
    "conversation_id": 1,
    "student_id": "abc-123",
    "class_id": 5,
    "started_at": "2026-07-06T12:00:00Z"
  }
]
```

| Status | Description |
| ------ | ----------- |
| `200`  | Array of conversations (may be empty) |
| `401`  | Missing or invalid token |
| `500`  | Server error |

---

### Root

#### `GET /`

Health-check endpoint. Returns:

```json
{ "message": "Welcome to GoTutor.ai!" }
```

## Scripts

| Script        | Command                              | Description                |
| ------------- | ------------------------------------ | -------------------------- |
| `npm run dev` | `tsx watch --env-file=../.env index.ts` | Dev server with hot reload |
| `npm start`   | `tsx --env-file=../.env index.ts`       | Production start           |

## Authentication Flow

1. The frontend authenticates the user via **Supabase Auth** and obtains a JWT.
2. Every API request includes the JWT as `Authorization: Bearer <token>`.
3. The backend validates the token server-side using `supabase.auth.getUser(token)`.
4. The Supabase client is initialized with the **service-role key**, allowing it to bypass Row-Level Security for privileged operations (e.g. deleting underage users).
