# MoodNest — Personal Mood & Wellness Journal

MoodNest is a responsive full-stack journal built with HTML, CSS, Vanilla JavaScript, Node.js, Express, Supabase Auth, and Supabase PostgreSQL.

## Features

- Email/password sign-up, sign-in, and sign-out through Supabase Auth.
- Private per-user entries enforced by PostgreSQL Row Level Security.
- One entry per user per date, with create, read, update, and delete operations.
- Mood, mood intensity, sleep duration, sleep quality, optional notes, and wellness tags.
- Weekly Monday–Sunday journal view and simple mood/sleep visualizations.
- Responsive layout, accessible controls, validation, error messages, and reduced-motion support.

## Folder structure

```text
moodnest/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── journal.html
│   ├── weekly.html
│   ├── insights.html
│   ├── css/styles.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── journal.js
│       ├── weekly.js
│       └── insights.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/supabase.js
│   ├── middleware/
│   ├── routes/entries.js
│   └── controllers/entriesController.js
├── database/schema.sql
└── README.md
```

## Requirements

- Node.js 18 or newer
- A Supabase project
- Internet access in the browser for the Supabase JS CDN and Google Fonts (the app's core API is served locally)

## 1. Create the Supabase project

1. Create a project in the Supabase dashboard.
2. Open **Project Settings → API** (or the API keys section in the current dashboard).
3. Copy the project URL and the publishable key (or legacy anon key). These are public client credentials, not service-role secrets.
4. Open **SQL Editor**, paste all of `database/schema.sql`, and run it.
5. In **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000`. If email confirmation is enabled, configure the confirmation redirect to your local app as appropriate.
6. For the easiest local demonstration, you can turn email confirmation off in Auth settings while testing. For a real deployment, keep confirmation enabled and configure your production redirect URLs.

## 2. Configure the frontend

Edit `frontend/js/config.js` and replace:
- `https://YOUR_PROJECT_ID.supabase.co` with your project's URL.
- `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with the project's publishable/anon key.
- For the Live Server URL `http://127.0.0.1:5500`, set `API_BASE_URL` to `http://127.0.0.1:3000`. Start the backend from the `backend` folder with `npm run dev`. The backend allows the local Live Server origin in development. Alternatively, leave `API_BASE_URL` empty when the backend serves the frontend at `http://localhost:3000`. If the frontend and backend are hosted separately, set it to the backend's base URL (for example, `https://api.example.com`).

Do not place a `service_role` or secret key in this file.

## 3. Configure the backend

Open a terminal in the `backend` folder and run:

```bash
npm install
```

Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same project URL and publishable/anon key. On macOS/Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Keep `.env` private; never commit it.

## 4. Run MoodNest

From the `backend` directory:

```bash
npm run dev
```

Or, without auto-reload:

```bash
npm start
```

Open **http://localhost:3000**. Express serves the frontend and API from one origin, avoiding local CORS setup. Do not open the HTML files with `file://`; use the local server.

## API overview

All endpoints except `/api/health` require `Authorization: Bearer <Supabase access token>`. The frontend attaches the signed-in session token automatically.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/entries/dashboard` | Entry count, average sleep, most common mood, recent entries |
| GET | `/api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD` | Entries in a date range |
| GET | `/api/entries?limit=90` | Most recent entries (up to 365) |
| GET | `/api/entries/by-date/YYYY-MM-DD` | Find entry for a date; returns `entry: null` when none exists |
| GET | `/api/entries/:id` | Get one entry |
| POST | `/api/entries` | Create entry |
| PUT | `/api/entries/:id` | Replace editable fields on an entry |
| DELETE | `/api/entries/:id` | Delete entry |

### Example request body

```json
{
  "entry_date": "2026-10-27",
  "mood": "Calm",
  "mood_intensity": 3,
  "sleep_minutes": 450,
  "sleep_quality": "Good",
  "notes": "A quiet day with time to reset.",
  "tags": ["Rest", "Family"]
}
```

Successful create responds with HTTP `201` and `{ "entry": { ... } }`. Invalid fields respond with HTTP `400`; duplicate entries for the same date respond with HTTP `409`; unauthenticated requests respond with HTTP `401`. RLS ensures a user cannot access another user's rows even if they alter an entry ID.

## Privacy and security notes

- Supabase Auth manages password storage and session tokens.
- The server validates access tokens using Supabase Auth.
- Each database client forwards the signed-in user's JWT, so RLS evaluates the user's identity.
- The app does not use a service-role key.
- Entry ownership is determined from the verified token, never a client-supplied `user_id`.
- Rate limiting, Helmet security headers, request-size limits, server-side validation, and database constraints are enabled.
- The app does not log journal content or access tokens.

Before production deployment, configure a strict Content Security Policy, HTTPS, exact CORS origins if hosting the frontend separately, Supabase Auth redirect URLs, and monitoring appropriate to your hosting provider. The CDN SDK and Google Fonts require network access.

## Privacy test checklist

1. Create account A and save an entry.
2. Sign out; create account B.
3. Confirm B sees no entries created by A.
4. While signed in as B, attempt to request A's entry UUID through `GET /api/entries/:id`; it should return `404` because RLS hides the row.
5. Try a duplicate entry for the same date; the UI should offer editing and the API should return `409` for a duplicate insert.
6. Sign out and call an entry endpoint without a bearer token; it should return `401`.
7. Verify the browser source contains only the publishable/anon key, never a service-role key.

## Troubleshooting

- **Setup message on login page:** check `frontend/js/config.js` for the correct project URL and publishable/anon key.
- **Invalid API key:** ensure the key belongs to the same Supabase project URL.
- **401 / session expired:** sign in again; check Auth settings and browser storage.
- **Database relation missing:** run `database/schema.sql` in the correct project's SQL Editor.
- **Permission denied / no rows:** verify RLS is enabled and the SQL policies have been created.
- **Sign-up says check email:** email confirmation is enabled; confirm the account before signing in.
- **Port already in use:** set another `PORT` in `backend/.env`.
- **Blank styling or missing fonts:** check internet access and that `frontend/css/styles.css` is present.
- **Changes not visible:** hard refresh the browser and restart the server if needed.

## Academic project note

MoodNest is a wellness journaling tool, not a medical device. Its summaries are descriptive only and should not be used to diagnose or treat a condition.
