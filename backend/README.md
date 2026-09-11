# internsheu backend

Express API for the Academia-Industry Collaboration Portal. Currently
serves mock data shaped to match what a Postgres-backed version would
return, so the frontend integration doesn't need to change when a real
database is wired up.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

The server starts on `http://localhost:5000` by default (see `PORT` in
`.env`).

## Structure

```
backend/
  server.js            Express app entry point — CORS, JSON body parsing, route mounting
  routes/
    student.js          GET /api/student/dashboard
  data/
    studentDashboard.js  Mock records — swap for real DB queries later
  .env.example
```

## Endpoints

| Method | Path                      | Description                                      |
| ------ | ------------------------- | ------------------------------------------------- |
| GET    | `/api/health`             | Liveness check                                     |
| GET    | `/api/student/dashboard`  | Student profile, skills, and matched opportunities |

## Adding a real database

`DATABASE_URL` in `.env.example` is a placeholder for a Postgres
connection string. To wire it up:

1. `npm install pg`
2. Replace the static exports in `data/studentDashboard.js` with query
   functions (e.g. `SELECT * FROM students WHERE id = $1`).
3. Keep the response shape in `routes/student.js` the same — the frontend
   already expects `{ student, matchedOpportunities }`.
