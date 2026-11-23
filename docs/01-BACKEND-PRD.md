# Backend Product Requirements Document (PRD)
## Project Management REST API (Node.js + Express + MongoDB)

---

## 1. Product Overview

A multi-user **Project Management Backend API** built with **Node.js (ES Modules)**, **Express 5**, and **MongoDB / Mongoose 9**. It supports secure cookie-based JWT authentication, email verification and password recovery, project workspaces, an in-app member invitation approval workflow, granular role-based access control (RBAC), task management with file attachments, subtasks, and personal project notes.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Runtime & Framework | Node.js (ESM) + Express 5 | HTTP API routing & middleware pipeline |
| Database & ODM | MongoDB + Mongoose 9 | Schema modeling, validation & aggregation pipelines |
| Authentication | JWT (`jsonwebtoken`) + `bcrypt` + `cookie-parser` | Access/refresh tokens in `httpOnly` cookies + password hashing |
| Validation | `express-validator` | Declarative request body validation |
| File Uploads & CDN | `multer` (`memoryStorage`) + `imagekit` | Task attachments (max 5 MB per file) streamed directly to ImageKit CDN, cleaned up on task delete |
| Email Service | `mailgen` + `nodemailer` (Mailtrap Sandbox in dev) | Account verification & password reset emails |
| Cross-Origin | `cors` (`credentials: true`) | Frontend SPA communication with cookies |

---

## 3. Data Models

### 3.1 `User` (`users`)
- `username` (String, required, unique, lowercase, trimmed, indexed)
- `email` (String, required, unique, lowercase, trimmed)
- `fullName` (String, trimmed)
- `password` (String, required — hashed via `bcrypt` in `pre("save")` hook)
- `avatar` (`{ url: String, localPath: String }`, default placeholder)
- `isEmailVerified` (Boolean, default `false`)
- `refreshToken` (String)
- `emailVerificationToken` (String — SHA-256 hash) & `emailVerificationExpiry` (Date)
- `forgotPasswordToken` (String — SHA-256 hash) & `forgotPasswordExpiry` (Date)
- `timestamps: true`

### 3.2 `Project` (`projects`)
- `name` (String, required, unique, trimmed)
- `description` (String, trimmed)
- `createdBy` (ObjectId → `user`, required)
- `timestamps: true`

### 3.3 `ProjectMember` (`projectmembers`)
- `user` (ObjectId → `user`, required)
- `project` (ObjectId → `project`, required)
- `role` (String, enum: `"admin" | "project_admin" | "member"`, default `"member"`)
- `status` (String, enum: `"pending" | "accepted"`, default `"pending"`)
- `invitedBy` (ObjectId → `user`)
- `timestamps: true`

### 3.4 `Task` (`tasks`)
- `name` (String, required, trimmed)
- `content` (String, trimmed)
- `status` (String, enum: `"todo" | "in_progress" | "done"`, default `"todo"`)
- `assignedTo` (ObjectId → `user`)
- `assignedBy` (ObjectId → `user`)
- `project` (ObjectId → `project`, required)
- `attatchments` (`[{ url: String, fileId: String, thumbnailUrl: String, MimeType: String, size: Number }]`, default `[]`)
- `timestamps: true`

### 3.5 `SubTask` (`subtasks`)
- `title` (String, required, trimmed)
- `content` (String, required, trimmed)
- `task` (ObjectId → `task`, required)
- `timestamps: true`

### 3.6 `Note` (`notes`)
- `title` (String, required, trimmed)
- `project` (ObjectId → `project`, required)
- `createdBy` (ObjectId → `user`, required)
- `timestamps: true`

---

## 4. Role-Based Access Control (RBAC) & Invitation Rules

Users **must** have an `"accepted"` membership in a project before accessing any of its data. Pending invitees are blocked by `validateProjectPermission` with `403`.

| Resource & Action | `admin` | `project_admin` | `member` (Assignee) | `member` (Non-Assignee) | Pending Invitee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Create a new project | Yes | Yes | Yes | Yes | Yes |
| Accept / Decline own project invitation | — | — | — | — | Yes |
| View project, tasks, subtasks, members | Yes | Yes | Yes | Yes | **No (`403`)** |
| Edit / Delete project | Yes | No | No | No | No |
| Invite member to project (`pending`) | Yes | Yes | No | No | No |
| Update member role / Remove member | Yes | No | No | No | No |
| Create / Full Edit / Delete task | **Yes** | No | No | No | No |
| Update task status (`PATCH /:taskId/status`) | **Yes** | **Yes** | **Yes** | No | No |
| Create / Edit / Delete subtask | **Yes** | **Yes** | No | No | No |
| Create / List own project notes | Yes | Yes | Yes | Yes | No |
| Update / Delete **own** note | Yes | Yes | Yes | Yes | No |
| Update / Delete **someone else's** note | No | No | No | No | No |

---

## 5. API Specification

**Base URL:** `/api/v1`

### Standard Response Envelopes
```json
// Success (apiResponse)
{ "statusCode": 200, "data": {}, "message": "success", "success": true }

// Error (apiError via global error handler)
{ "statusCode": 422, "message": "received data is not valid", "errors": [{ "field": "message" }], "success": false, "data": null }
```

### 5.1 Healthcheck (`/api/v1/healthcheck`)
| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Returns `{ message: "server is healthy" }` |

### 5.2 Authentication (`/api/v1/auth`)
| Method | Path | Auth | Body / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | `{ username, email, password }` | Creates user & sends verification email |
| `POST` | `/login` | Public | `{ email, password }` | Sets `accessToken` & `refreshToken` cookies + returns user & tokens |
| `GET` | `/verify-email/:verificationToken` | Public | Param: `verificationToken` | Verifies email using SHA-256 token match |
| `POST` | `/refresh-token` | Public | Cookie or `{ refreshToken }` | Rotates access & refresh tokens |
| `POST` | `/forgot-password` | Public | `{ email }` | Emails reset link (`FORGOT_PASSWORD_REDIRECT_URL/:token`) |
| `POST` | `/reset-password/:token` | Public | Param: `token`, Body: `{ password }` | Updates password if reset token is valid & unexpired |
| `POST` | `/logout` | `verifyJWT` | — | Clears DB `refreshToken` and cookies |
| `GET` | `/current-user` | `verifyJWT` | — | Returns authenticated user profile |
| `POST` | `/change-password` | `verifyJWT` | `{ oldPassword, newPassword }` | Verifies current password and saves new password |
| `POST` | `/resend-email-verification` | `verifyJWT` | — | Resends verification email if unverified |

### 5.3 Projects, Invitations & Members (`/api/v1/projects` — all require `verifyJWT`)
| Method | Path | Permission | Body / Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Lists all **accepted** projects for current user with accepted member count & user role |
| `POST` | `/` | Authenticated | `{ name, description? }` — creates project & adds creator as `admin` (`accepted`) |
| `GET` | `/invitations` | Authenticated | Lists all `pending` project invitations for current user (with project & inviter info) |
| `PATCH` | `/invitations/:invitationId/accept` | Invitee | Marks invitation `accepted`, granting project access |
| `PATCH` | `/invitations/:invitationId/reject` | Invitee | Declines & deletes pending invitation |
| `GET` | `/:projectId` | Any accepted member | Fetches project details |
| `PUT` | `/:projectId` | `admin` | `{ name, description? }` — updates project |
| `DELETE` | `/:projectId` | `admin` | Deletes project |
| `GET` | `/:projectId/members` | Any accepted member | Lists project members with `user`, `role`, and `status` (`accepted` / `pending`) |
| `POST` | `/:projectId/members` | `admin`, `project_admin` | `{ email, role }` — creates/updates a `pending` invitation (`409` if already accepted) |
| `PUT` | `/:projectId/members/:userId` | `admin` | `{ newRole }` — updates member role |
| `DELETE` | `/:projectId/members/:userId` | `admin` | Removes member or cancels pending invitation |

### 5.4 Tasks & Subtasks (`/api/v1/projects/:projectId/tasks` — all require `verifyJWT`, `mergeParams: true`)
| Method | Path | Permission | Body / Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Any accepted member | Lists project tasks with populated `assignedTo` |
| `POST` | `/` | `admin` | `multipart/form-data`: `name`, `content?`, `status`, `assignedTo`, `attachments[]` (max 5 MB each, uploaded to ImageKit) |
| `GET` | `/:taskId` | Any accepted member | Aggregates task with populated `assignedTo` and `subTasks` |
| `PUT` | `/:taskId` | `admin` | `multipart/form-data`: full task update + append new `attachments[]` |
| `PATCH` | `/:taskId/status` | `admin`, `project_admin`, or task assignee | `{ status }` — status-only progress update |
| `DELETE` | `/:taskId` | `admin` | Deletes task |
| `GET` | `/:taskId/subtask` | Any accepted member | Fetches subtasks for a task |
| `POST` | `/:taskId/subtask` | `admin`, `project_admin` | `{ title, content }` — creates subtask |
| `PUT` | `/:taskId/subtask/:subTaskId` | `admin`, `project_admin` | `{ title?, content? }` — updates subtask |
| `DELETE` | `/:taskId/subtask/:subTaskId` | `admin`, `project_admin` | Deletes subtask |

### 5.5 Personal Project Notes (`/api/v1/projects/:projectId/notes` — all require `verifyJWT`, `mergeParams: true`)
| Method | Path | Permission | Body / Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Any accepted member | Aggregates all notes created by `req.user._id` in the project (with user & project metadata, newest first) |
| `POST` | `/` | Any accepted member | `{ title }` — creates a note owned by `req.user._id` |
| `PUT` | `/:noteId` | Note creator (`validateNotePermission()`) | `{ title }` — updates note |
| `DELETE` | `/:noteId` | Note creator (`validateNotePermission()`) | Deletes note |

---

## 6. Environment Variables (`backend/.env`)

```env
PORT=3000
MONGODB_URL=mongodb+srv://...
CORS_ORIGIN=http://localhost:5173
SERVER_URL=http://localhost:3000
NODE_ENV=development

ACCESS_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRY=10d

NODEMAILER_SMTP_HOST=sandbox.smtp.mailtrap.io
NODEMAILER_SMTP_PORT=2525
NODEMAILER_SMTP_USER=...
NODEMAILER_SMTP_PASS=...
FORGOT_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password

IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_id>
```
