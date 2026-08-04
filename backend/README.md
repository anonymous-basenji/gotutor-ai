# GoTutor.ai — Backend

REST API server for GoTutor.ai, an AI-powered tutoring platform. Built with **Express 5**, **TypeScript**, **Zod**, and **Supabase**.

## Tech Stack

| Layer           | Technology                   |
| --------------- | ---------------------------- |
| Runtime         | Node.js                      |
| Language        | TypeScript 6                 |
| Framework       | Express 5                    |
| Validation      | Zod 4                        |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Dev Runner      | tsx (watch mode)              |

## Project Structure

The backend follows a layered Controller-Service-Repository architecture:

```
backend/
├── controllers/            # Controller layer: Handles HTTP requests/responses & inputs
│   ├── auth.controller.ts
│   ├── class.controller.ts
│   └── conversation.controller.ts
├── services/               # Service layer: Business logic & authorization checks
│   ├── auth.service.ts
│   ├── class.service.ts
│   └── conversation.service.ts
├── repositories/           # Repository layer: Database queries via Supabase client
│   ├── class.repository.ts
│   ├── conversation.repository.ts
│   ├── membership.repository.ts
│   ├── message.repository.ts
│   └── user.repository.ts
├── routes/                 # Express route definitions & middleware wiring
│   ├── auth.routes.ts
│   ├── class.routes.ts
│   └── conversation.routes.ts
├── schemas/                # Zod validation schemas and DTO types
│   ├── auth.schemas.ts
│   └── class.schemas.ts
├── middleware/             # Express middlewares (JWT auth, error handler)
│   ├── auth.middleware.ts
│   └── errorHandler.middleware.ts
├── errors/                 # Custom error handling classes (AppError)
│   └── AppError.ts
├── interfaces/             # TypeScript domain models and interface types
│   └── models.ts
├── utils/                  # Helper utilities (age calculation, etc.)
│   └── age.ts
├── db.ts                   # Supabase client initialization
├── index.ts                # Express app setup, CORS, route mounting, server entry point
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

| Column          | Type     | Notes                         |
| --------------- | -------- | ----------------------------- |
| `user_id`       | `string` | PK, matches Supabase Auth UID |
| `email`         | `string` | Unique                        |
| `name`          | `string` |                               |
| `date_of_birth` | `string` |                               |

### `Class`

| Column     | Type     | Notes |
| ---------- | -------- | ----- |
| `class_id` | `string` | PK    |
| `name`     | `string` |       |

### `UserClass`

| Column     | Type     | Notes                                  |
| ---------- | -------- | -------------------------------------- |
| `user_id`  | `string` | FK → `User`                           |
| `class_id` | `string` | FK → `Class`                          |
| `role`     | `string` | `"supervisor"` or `"student"`          |

*Composite unique constraint on `(user_id, class_id)`.*

### `Conversation`

| Column            | Type     | Notes        |
| ----------------- | -------- | ------------ |
| `conversation_id` | `number` | PK           |
| `student_id`      | `string` | FK → `User`  |
| `class_id`        | `string` | FK → `Class` |
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

All protected endpoints require a `Bearer` token in the `Authorization` header (Supabase Auth JWT). Incoming requests are validated against Zod schemas, returning `400 Bad Request` on validation failure.

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
| `400`  | Invalid date of birth or missing fields |
| `401`  | Missing or invalid token |
| `403`  | User is under 13 (account deleted) |
| `500`  | Server error |

---

#### `GET /auth/me`

Returns the authenticated user's profile, including a computed `isAdult` boolean (age ≥ 18).

**Response (200):**

```json
{
  "user_id": "abc-123",
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
    "class_id": "1",
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
  "class_id": "1",
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

#### `POST /classes/add-user-by-email`

Adds a user to a class by their email address with an optional `role` (`"student"` or `"supervisor"`, defaulting to `"student"`). Requires the requester to be a supervisor in the class. If adding a supervisor, enforces that the target user is 18 years or older.

**Request Body:**

```json
{
  "class_id": "1",
  "email": "user@example.com",
  "role": "supervisor"
}
```

| Status | Description |
| ------ | ----------- |
| `201`  | User added successfully |
| `400`  | Invalid parameters or missing required fields |
| `401`  | Missing or invalid token |
| `403`  | Requester is not a supervisor OR target user is under 18 (when adding a supervisor) |
| `404`  | No registered user found with that email |
| `500`  | Server error |

---

#### `DELETE /classes/remove-user`

Removes a user from a class. Target user ID can be supplied in `user_id`, `target_user_id`, or `student_id`. If removing a student, requires the requester to be a supervisor. If removing a supervisor, only that exact supervisor can remove themselves, and there must be at least one other supervisor remaining in the class.

**Request Body:**

```json
{
  "class_id": "1",
  "user_id": "abc-123",
  "role": "supervisor"
}
```

*Note: `target_user_id` or `student_id` are also accepted as aliases for `user_id`.*

| Status | Description |
| ------ | ----------- |
| `200`  | User successfully removed |
| `400`  | `class_id` and target user ID are required |
| `401`  | Missing or invalid token |
| `403`  | Requester is not a supervisor (for student removal), requester is not self (for supervisor removal), or attempting to remove the last supervisor |
| `500`  | Server error |

---

#### `DELETE /classes/delete-class`

Deletes a class and all associated data (conversations, messages, class memberships). **Requires class supervisor role**.

**Request Body:**

```json
{
  "class_id": "1"
}
```

| Status | Description |
| ------ | ----------- |
| `200`  | Class and associated data successfully deleted |
| `400`  | `class_id` is required |
| `401`  | Missing or invalid token |
| `403`  | Access denied: Only supervisors can delete a class |
| `500`  | Server error |

---

#### `POST /classes/rename-class`

Renames an existing class. **Requires class supervisor role**.

**Request Body:**

```json
{
  "class_id": "1",
  "new_name": "Calculus II"
}
```

| Status | Description |
| ------ | ----------- |
| `200`  | Class successfully renamed |
| `400`  | `class_id` or `new_name` missing |
| `401`  | Missing or invalid token |
| `403`  | Access denied: Only supervisors can access this resource |
| `500`  | Server error |

---

### Conversations — `/conversations`

#### `GET /conversations?class_id=<id>&student_id=<student_id>`

Returns conversations within a specific class. Regular students can only fetch their own conversations. Supervisors can fetch student conversations by providing `student_id`, but cannot view conversations belonging to other supervisors.

**Query Parameters:**

| Param        | Type     | Required | Description        |
| ------------ | -------- | -------- | ------------------ |
| `class_id`   | `string` | Yes      | The class to filter by |
| `student_id` | `string` | No       | Target student ID (defaults to requesting user's ID) |

**Response (200):**

```json
[
  {
    "conversation_id": 1,
    "student_id": "abc-123",
    "class_id": "5",
    "started_at": "2026-07-06T12:00:00Z"
  }
]
```

| Status | Description |
| ------ | ----------- |
| `200`  | Array of conversations (may be empty) |
| `401`  | Missing or invalid token |
| `403`  | Requester is not a supervisor in the class OR target user is another supervisor |
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
4. Request bodies are validated using **Zod** schemas in [schemas/](file:///c:/Users/Andre/Development/gotutor-ai/backend/schemas).
5. Centralized error handling is performed via [middleware/errorHandler.middleware.ts](file:///c:/Users/Andre/Development/gotutor-ai/backend/middleware/errorHandler.middleware.ts).
6. The Supabase client is initialized with the **service-role key**, allowing it to bypass Row-Level Security for privileged operations (e.g. deleting underage users).
