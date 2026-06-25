# Artist Management System

A simple admin panel to manage artists and their songs. You can log in, add users, manage artist profiles, and handle each artist's song list.

## What it does

- Login and register (new managers can sign up from the login page)
- Dashboard with two tabs: **Users** and **Artists**
- View and manage songs for each artist on a separate page
- Import and export artists as CSV (for artist managers)

## User roles

| Role               | Permissions                                   |
| ------------------ | --------------------------------------------- |
| **Super admin**    | Manage users (create, edit, delete, list)     |
| **Artist manager** | Manage artists, import/export CSV, view songs |
| **Artist**         | View and manage their own songs only          |

## Business rules

- Only Super Admin can create user with (super_admin, artist_manager, artist) role
- Default registration page only assigns artist_manager role
- Only Artist Manager can create artist by selecting the artist user with no prior profile record or link in artist table
- Artist managers can also import artists via CSV using the unlinked-artist-user rule.

## Tech used

- **Backend:** Node.js, raw SQL with PostgreSQL (no ORM)
- **Frontend:** Plain HTML, CSS, and JavaScript
- **Auth:** JWT

## Setup

### 1. Database

Create a PostgreSQL database (for example `artist-mgmt-db`).

### 2. API

```bash
cd api
pnpm install
```

Copy `.env.example` to `.env` and update your database details if needed.

```bash
pnpm migrate
pnpm seed
pnpm start
```

API runs at `http://localhost:5000`

### 3. Client

Open a new terminal:

```bash
cd client
npx serve
```

## Test accounts (after seed)

admin@gmail.com (Super admin)
manager@gmail.com (Artist Manager)
bipul@gmail.com (Artist)
sujata@gmail.com (Artist)

## Project structure

```
api/          → REST API and database
client/       → Login, dashboard, and songs pages
```

## API examples

See `api/curl.txt` for sample requests.

## Sample export/import csv file

At root, I have added an csv file for import/export csv sample reference.
