# MyKeeper — Product Requirements Document

## What Is It?

**MyKeeper** is a personal cloud file manager — a Google Drive alternative you own and control. It lets you upload, organise, search, share, and manage your files from any browser, with a clean dark amber glassmorphism UI.

Built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and **Appwrite** as the backend.

---

## Purpose

| Goal | Detail |
|------|--------|
| Personal cloud storage | Upload documents, images, media, and other files to your private Appwrite bucket |
| Organised access | Browse files by category (Documents, Images, Media, Others) or search across all |
| Sharing | Share individual files with other users by email |
| Secure auth | Google OAuth login — no passwords to manage |

---

## Core Features

### 1. Authentication
- **Google OAuth** via Appwrite — one click to sign in
- Session persists via a secure `HttpOnly` cookie (`mykeeper_uid`)
- All routes behind `/` are protected — unauthenticated users are redirected to `/sign-in`
- Logout clears both the Appwrite browser session and the server cookie

### 2. Dashboard (`/`)
- **Storage Summary** — animated circular ring showing total % used (out of 2 GB)
- Category breakdown — Documents, Images, Media, Others with size per category
- **Recent files** — 10 most recently uploaded files listed by date

### 3. Category Pages (`/documents`, `/images`, `/media`, `/others`)
- Displays all files filtered by type in a responsive grid
- Shows total storage used by that category
- Supports **search** and **sorting** (see below)

### 4. File Upload
- Multi-file upload via the topbar "Upload" button
- Progress spinner while uploading; toast notification on success/failure
- Files stored in Appwrite Storage; metadata (name, type, size, owner) stored in Appwrite Database

### 5. Search
- Global search input in the topbar
- Updates the URL `?search=` param — results re-fetch server-side
- Works across all category pages

### 6. Sort
- Sort dropdown on each category page
- Options: Date (newest first), Date (oldest first), Name (A–Z), Name (Z–A), Size (largest), Size (smallest)
- Updates the URL `?sort=` param

### 7. File Actions (3-dots menu on each file card)
| Action | What it does |
|--------|-------------|
| **Rename** | Edit the display name stored in the DB |
| **Details** | View file format, size, owner, and last edited date |
| **Share** | Add user emails — they appear in the file's `users[]` array |
| **Download** | Direct browser download from Appwrite Storage |
| **Delete** | Removes from both Appwrite Storage and the DB |

### 8. Sidebar
- Navigation links to Dashboard and all 4 category pages
- Active page highlighted
- Mini storage bar (used / 2 GB)
- User avatar, name, and email
- Mobile: hamburger button opens a slide-in drawer

---

## User Flow

```
Visit app (any URL)
  → Not logged in? → /sign-in

/sign-in
  → Click "Continue with Google"
  → Appwrite OAuth → Google consent
  → Redirected to /auth/callback
      → account.createSession(userId, secret)  [token exchange]
      → Create user doc in DB (first-time login only)
      → Set HttpOnly session cookie
  → Redirect to / (Dashboard)

Dashboard
  → See storage summary + recent files
  → Click sidebar category → see filtered grid
  → Search → results update via URL params
  → Sort → results reorder via URL params
  → Upload → file appears in grid
  → 3-dots on file → Rename / Share / Delete / Details / Download

Logout (topbar icon)
  → Clears Appwrite browser session + server cookie
  → Redirect to /sign-in
```

---

## Data Model

### `users` collection
| Field | Type | Notes |
|-------|------|-------|
| `accountId` | string | Appwrite Auth user `$id` |
| `fullName` | string | From Google profile |
| `email` | string | From Google profile |
| `avatar` | string | DiceBear SVG URL |

### `files` collection
| Field | Type | Notes |
|-------|------|-------|
| `fileName` | string | Display name (can be renamed) |
| `fileType` | enum | `document`, `image`, `media`, `other` |
| `fileSize` | integer | Bytes |
| `fileUrl` | url | Appwrite Storage view URL |
| `bucketField` | string | Appwrite Storage file `$id` (for delete) |
| `accountId` | string | Owner's accountId |
| `fileExtension` | string | e.g. `pdf`, `png` |
| `users` | string[] | Emails of users the file is shared with |

---

## Technical Architecture

```
Browser
  ├── Next.js Client Components (sign-in, topbar, file cards, modals)
  │     └── Appwrite Browser SDK (auth, file view URLs)
  └── Next.js Server Components (layout, dashboard, category pages)
        └── Server Actions → Appwrite Admin Client (API key)
              ├── Appwrite Database (users + files collections)
              └── Appwrite Storage (file binary storage)
```

> **Session strategy:** After OAuth, a one-time `userId`+`secret` token is exchanged for a real session via `account.createSession()`. The resulting `accountId` is stored as an `HttpOnly` cookie (`mykeeper_uid`) so the server can identify the user on every request without depending on Appwrite's internal localStorage-based session.

---

## Storage Limits
- Total bucket: **2 GB** per user (configurable via `TOTAL_STORAGE_BYTES` in `file.actions.js`)
- Individual file size limit set in the Appwrite console bucket settings
