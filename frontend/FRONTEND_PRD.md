# Frontend Product Requirements Document (PRD)
## Project Management Web Application (React)

---

## 1. Overview & Goals

Build a responsive, role-aware **React** single-page application (SPA) that integrates with the existing Node.js / Express / MongoDB backend (`/api/v1`).

### Core Goals
- Provide a clean, intuitive workspace for teams to manage **Projects**, **Tasks**, **Subtasks**, **Team Members**, and **Personal Project Notes**.
- Enforce role-based UI controls (`admin`, `project_admin`, `member`, task assignee, and note creator) aligned with backend permissions.
- Handle cookie-based JWT authentication seamlessly (including automatic access-token refresh, email verification, and password reset flows).

---

## 2. Recommended Tech Stack

| Layer | Recommendation | Why |
| :--- | :--- | :--- |
| Build Tool & Framework | **Vite + React** | Fast dev server on `http://localhost:5173` (matches backend CORS default) |
| Routing | **React Router v7** | Nested workspace layouts & protected route guards |
| HTTP Client | **Axios** (`withCredentials: true`) | Automatic `httpOnly` cookie support + response interceptor for `/auth/refresh-token` |
| Server State / Caching | **TanStack Query (React Query)** | Caching, optimistic updates, loading/error states, automatic refetch on mutations |
| Client Auth State | **React Context** (or Zustand) | Lightweight global `user` + auth loading state |
| Styling | **Tailwind CSS** (+ shadcn/ui or Headless UI) | Rapid, consistent, responsive UI components |
| Forms & Validation | **React Hook Form** | Clean field-level validation & easy mapping of backend `422` `errors[]` |
| Notifications & Icons | **Sonner** (or `react-hot-toast`) + **Lucide React** | Toast feedback for API responses & crisp icons |

---

## 3. User Roles & Permissions Matrix

The frontend must conditionally show, hide, or disable controls to match backend authorization rules:

| Feature / Action | `admin` | `project_admin` | `member` (Assignee) | `member` (Non-Assignee) |
| :--- | :---: | :---: | :---: | :---: |
| Create a new project | Yes | Yes | Yes | Yes |
| View project & tasks | Yes | Yes | Yes | Yes |
| Edit / Delete project | Yes | No | No | No |
| View project members | Yes | Yes | Yes | Yes |
| Add member to project | Yes | Yes | No | No |
| Update member role / Remove member | Yes | No | No | No |
| Create / Delete task | Yes | Yes | No | No |
| Update task (fields + attachments) | Yes | Yes | Yes | No |
| View subtasks | Yes | Yes | Yes | Yes |
| Create / Update / Delete subtask | Yes | Yes | Yes | No |
| Create / View / Update / Delete **own** notes | Yes | Yes | Yes | Yes |
| Update / Delete **another user's** notes | No | No | No | No |

---

## 4. Application Route Map

### Public Routes (Redirect to `/projects` if already authenticated)
- `/login` — Sign in
- `/register` — Create account
- `/forgot-password` — Request password reset email
- `/reset-password/:token` — Set new password (matches `FORGOT_PASSWORD_REDIRECT_URL`)
- `/verify-email/:verificationToken` — Email verification landing page

### Protected Routes (Require authenticated user via `GET /api/v1/auth/current-user`)
- `/projects` — Projects dashboard (all projects user belongs to)
- `/projects/:projectId` — Project Workspace layout (sidebar + topbar)
  - `/projects/:projectId/tasks` — Tasks board / list view (default tab)
  - `/projects/:projectId/tasks/:taskId` — Task detail drawer/page (attachments + subtasks)
  - `/projects/:projectId/members` — Project team & role management
  - `/projects/:projectId/notes` — Personal notes for this project
  - `/projects/:projectId/settings` — Project edit & danger zone (`admin` only)
- `/profile` — Current user details, email verification banner/resend, change password

---

## 5. Feature Requirements & Acceptance Criteria

### 5.1 Authentication & Account Management
- **Register (`/register`)**:
  - Fields: `username` (lowercase, 3–20 chars), `email`, `password`.
  - On success (`201`): show confirmation banner instructing the user to check their email to verify, and link to `/login`.
- **Login (`/login`)**:
  - Fields: `email`, `password`.
  - Calls `POST /api/v1/auth/login` with `withCredentials: true`.
  - Stores user in Auth Context and redirects to `/projects`.
- **Session Persistence & Silent Token Refresh**:
  - On app load, call `GET /api/v1/auth/current-user`.
  - Configure an Axios response interceptor: on `401`, call `POST /api/v1/auth/refresh-token` once and retry the failed request; if refresh fails, clear auth state and redirect to `/login`.
- **Email Verification**:
  - If `!user.isEmailVerified`, display a dismissible top banner with a **"Resend Verification Email"** button (`POST /api/v1/auth/resend-email-verification`).
  - Visiting `/verify-email/:verificationToken` calls `GET /api/v1/auth/verify-email/:verificationToken` and shows success or expired/invalid state.
- **Password Flows**:
  - **Forgot Password**: submit `email` → `POST /api/v1/auth/forgot-password` → show confirmation message.
  - **Reset Password**: submit `password` → `POST /api/v1/auth/reset-password/:token` → redirect to `/login`.
  - **Change Password** (in `/profile`): submit `oldPassword`, `newPassword` → `POST /api/v1/auth/change-password`.
- **Logout**:
  - Calls `POST /api/v1/auth/logout`, clears React Query cache & Auth Context, redirects to `/login`.

### 5.2 Projects Dashboard (`/projects`)
- Fetches `GET /api/v1/projects` and displays project cards showing:
  - Project `name`, `description`, total `members` count, current user's `role` badge, and `createdAt`.
- **"New Project" Modal**:
  - Fields: `name` (required), `description` (optional) → `POST /api/v1/projects`.
- Clicking a card navigates to `/projects/:projectId/tasks`.
- Empty state with CTA when user has no projects yet.

### 5.3 Project Workspace & Settings (`/projects/:projectId/settings`)
- Workspace shell displays active project name, user's role badge, and navigation tabs: **Tasks**, **Members**, **Notes**, and **Settings** (visible to `admin`).
- **Project Settings (`admin` only)**:
  - Edit `name` and `description` (`PUT /api/v1/projects/:projectId`).
  - Delete project with a confirmation dialog (`DELETE /api/v1/projects/:projectId`) → redirect to `/projects`.

### 5.4 Team Members (`/projects/:projectId/members`)
- Lists members from `GET /api/v1/projects/:projectId/members` showing avatar, `fullName` / `username`, `email`, and role.
- **Add Member (`admin` & `project_admin`)**:
  - Form: `email`, `role` dropdown (`admin`, `project_admin`, `member`) → `POST /api/v1/projects/:projectId/members`.
- **Change Role (`admin` only)**:
  - Role dropdown per member → `PUT /api/v1/projects/:projectId/members/:userId` with `{ newRole }`.
- **Remove Member (`admin` only)**:
  - Confirmation prompt → `DELETE /api/v1/projects/:projectId/members/:userId`.

### 5.5 Tasks & Attachments (`/projects/:projectId/tasks`)
- Fetches `GET /api/v1/projects/:projectId/tasks`.
- **View Modes**:
  - **Kanban Board** grouped into 3 columns matching backend enum: `todo` (To Do), `in_progress` (In Progress), `done` (Done).
  - **List / Table View** toggle with search and status/assignee filters.
- **Create Task Modal (`admin` & `project_admin`)**:
  - Fields: `name` (required), `content` (optional), `status` (`todo` | `in_progress` | `done`), `assignedTo` (dropdown populated from project members), and multi-file `attachments` picker (enforce 1MB per file client-side to match Multer limit).
  - Sends `multipart/form-data` to `POST /api/v1/projects/:projectId/tasks`.
- **Task Detail View (`/projects/:projectId/tasks/:taskId`)**:
  - Fetches `GET /api/v1/projects/:projectId/tasks/:taskId`.
  - Displays full task details, status selector, assignee info, attachments list (with preview/download links), and subtasks section.
  - **Edit Task (`admin`, `project_admin`, or assigned `member`)**: update `name`, `content`, `status`, `assignedTo`, or upload additional `attachments` via `PUT /api/v1/projects/:projectId/tasks/:taskId`.
  - **Delete Task (`admin` & `project_admin`)**: confirmation dialog → `DELETE /api/v1/projects/:projectId/tasks/:taskId`.

### 5.6 Subtasks (Inside Task Detail View)
- Displays `subTasks` returned from `GET /api/v1/projects/:projectId/tasks/:taskId` (or `GET /api/v1/projects/:projectId/tasks/:taskId/subtask`).
- **Authorized users (`admin`, `project_admin`, or task assignee)** can:
  - **Add Subtask**: `title` (required), `content` (required) → `POST /api/v1/projects/:projectId/tasks/:taskId/subtask`.
  - **Edit Subtask**: inline or modal edit for `title`, `content` → `PUT /api/v1/projects/:projectId/tasks/:taskId/subtask/:subTaskId`.
  - **Delete Subtask**: confirmation → `DELETE /api/v1/projects/:projectId/tasks/:taskId/subtask/:subTaskId`.

### 5.7 Personal Project Notes (`/projects/:projectId/notes`)
- Fetches `GET /api/v1/projects/:projectId/notes` (returns only notes created by the logged-in user in this project, newest first).
- Displays each note's `title`, `createdAt`, `updatedAt`, creator info, and project name.
- **Create Note**: `title` → `POST /api/v1/projects/:projectId/notes`.
- **Edit Note**: inline/modal update `title` → `PUT /api/v1/projects/:projectId/notes/:noteId`.
- **Delete Note**: confirmation → `DELETE /api/v1/projects/:projectId/notes/:noteId`.

---

## 6. Backend API Contract Summary

**Base URL:** `VITE_API_BASE_URL=http://localhost:3000/api/v1` (adjust port to match `.env`)

### Standard Response Formats
```json
// Success
{
  "statusCode": 200,
  "data": {},
  "message": "success",
  "success": true
}

// Error
{
  "statusCode": 422,
  "message": "received data is not valid",
  "errors": [{ "email": "Email is not valid" }],
  "success": false,
  "data": null
}
```

### Endpoints

| Group | Method | Endpoint | Payload / Notes |
| :--- | :--- | :--- | :--- |
| Health | `GET` | `/healthcheck` | — |
| Auth | `POST` | `/auth/register` | `{ username, email, password }` |
| Auth | `POST` | `/auth/login` | `{ email, password }` |
| Auth | `GET` | `/auth/verify-email/:verificationToken` | — |
| Auth | `POST` | `/auth/refresh-token` | Cookie or `{ refreshToken }` |
| Auth | `POST` | `/auth/forgot-password` | `{ email }` |
| Auth | `POST` | `/auth/reset-password/:token` | `{ password }` |
| Auth | `POST` | `/auth/logout` | Auth required |
| Auth | `GET` | `/auth/current-user` | Auth required |
| Auth | `POST` | `/auth/change-password` | Auth; `{ oldPassword, newPassword }` |
| Auth | `POST` | `/auth/resend-email-verification` | Auth required |
| Projects | `GET` | `/projects` | Auth |
| Projects | `POST` | `/projects` | Auth; `{ name, description? }` |
| Projects | `GET` | `/projects/:projectId` | Member |
| Projects | `PUT` | `/projects/:projectId` | Admin; `{ name, description? }` |
| Projects | `DELETE` | `/projects/:projectId` | Admin |
| Members | `GET` | `/projects/:projectId/members` | Member |
| Members | `POST` | `/projects/:projectId/members` | Admin / Project Admin; `{ email, role }` |
| Members | `PUT` | `/projects/:projectId/members/:userId` | Admin; `{ newRole }` |
| Members | `DELETE` | `/projects/:projectId/members/:userId` | Admin |
| Tasks | `GET` | `/projects/:projectId/tasks` | Member |
| Tasks | `POST` | `/projects/:projectId/tasks` | Admin / Project Admin; `multipart/form-data` (`name`, `content?`, `status`, `assignedTo`, `attachments`) |
| Tasks | `GET` | `/projects/:projectId/tasks/:taskId` | Member |
| Tasks | `PUT` | `/projects/:projectId/tasks/:taskId` | Admin / Project Admin / Assignee; `multipart/form-data` |
| Tasks | `DELETE` | `/projects/:projectId/tasks/:taskId` | Admin / Project Admin |
| Subtasks | `GET` | `/projects/:projectId/tasks/:taskId/subtask` | Member |
| Subtasks | `POST` | `/projects/:projectId/tasks/:taskId/subtask` | Admin / Project Admin / Assignee; `{ title, content }` |
| Subtasks | `PUT` | `/projects/:projectId/tasks/:taskId/subtask/:subTaskId` | Admin / Project Admin / Assignee; `{ title?, content? }` |
| Subtasks | `DELETE` | `/projects/:projectId/tasks/:taskId/subtask/:subTaskId` | Admin / Project Admin / Assignee |
| Notes | `GET` | `/projects/:projectId/notes` | Member (own notes) |
| Notes | `POST` | `/projects/:projectId/notes` | Member; `{ title }` |
| Notes | `PUT` | `/projects/:projectId/notes/:noteId` | Owner; `{ title }` |
| Notes | `DELETE` | `/projects/:projectId/notes/:noteId` | Owner |

> **Important Backend Field Names to Match:**
> - Task attachments field in MongoDB is spelled `attatchments` (each item has `{ url, MimeType, size }`), while the multipart upload field name is `attachments`.
> - Task statuses: `"todo"`, `"in_progress"`, `"done"`.
> - Roles: `"admin"`, `"project_admin"`, `"member"`.

---

## 7. UI/UX & Non-Functional Requirements

- **Loading States:** Skeleton loaders for project cards, task boards, and detail drawers; disabled submit buttons with spinners during mutations.
- **Error Handling:**
  - Map `422` `errors[]` directly to form field error messages.
  - Display toast notifications for `400`/`403`/`404`/`500` responses using `err.response.data.message`.
- **Responsive Design:** Mobile-friendly collapsible sidebar, scrollable Kanban columns on smaller screens.
- **Accessibility:** Keyboard-accessible modals/dialogs, clear focus rings, proper `<label>` associations.

---

## 8. Suggested React Folder Structure

```text
frontend/
├── .env                          # VITE_API_BASE_URL=http://localhost:3000/api/v1
├── src/
│   ├── api/
│   │   ├── axios.js              # Axios instance + refresh-token interceptor
│   │   ├── auth.api.js
│   │   ├── project.api.js
│   │   ├── task.api.js
│   │   └── note.api.js
│   ├── components/
│   │   ├── ui/                   # Reusable Button, Input, Modal, Badge, Spinner
│   │   ├── layout/               # AppShell, Sidebar, Topbar, EmailVerifyBanner
│   │   ├── projects/             # ProjectCard, CreateProjectModal
│   │   ├── tasks/                # KanbanBoard, TaskCard, TaskFormModal, SubTaskList
│   │   ├── members/              # MemberTable, AddMemberModal
│   │   └── notes/                # NoteCard, NoteFormModal
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   ├── useTasks.js
│   │   └── useNotes.js
│   ├── pages/
│   │   ├── auth/                 # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│   │   ├── ProjectsPage.jsx
│   │   ├── ProjectTasksPage.jsx
│   │   ├── TaskDetailPage.jsx
│   │   ├── ProjectMembersPage.jsx
│   │   ├── ProjectNotesPage.jsx
│   │   ├── ProjectSettingsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx
│   │   └── PublicRoute.jsx
│   ├── utils/
│   │   └── constants.js          # Mirror roles & task statuses
│   ├── App.jsx
│   └── main.jsx
```

---

## 9. Implementation Roadmap

1. **Phase 1 — Project Setup & Auth Foundation**
   - Scaffold Vite + React + Tailwind + React Router + Axios + TanStack Query.
   - Build `axios.js` with `withCredentials: true` and `401` refresh-token interceptor.
   - Implement `AuthContext`, `ProtectedRoute`, `PublicRoute`, Login, Register, Logout, Profile, Email Verification, and Forgot/Reset/Change Password screens.
2. **Phase 2 — Projects & Workspace Shell**
   - Build `/projects` dashboard, Create Project modal, Workspace sidebar/topbar layout, and Project Settings (Edit/Delete for `admin`).
3. **Phase 3 — Team Members & Role Management**
   - Build Members list, Add Member modal, inline Role Update (`admin`), and Remove Member (`admin`).
4. **Phase 4 — Tasks, Attachments & Subtasks**
   - Build Kanban + List views, Create/Edit Task modal with file upload (`multipart/form-data`), Task Detail view, and full Subtask CRUD.
5. **Phase 5 — Personal Project Notes**
   - Build Notes list, Create/Edit/Delete note UI.
6. **Phase 6 — Polish & End-to-End Verification**
   - Responsive tweaks, loading skeletons, empty states, form error mapping, and full role-based manual testing across `admin`, `project_admin`, and `member` accounts.

---

## 10. Small Backend Improvements Worth Making Alongside Frontend Work

- **`getProjectMembers` (`src/controllers/project.controller.js`)**: Include `role: 1` inside the final `$project` stage so the frontend Members table can display each member's current role.
- **`FORGOT_PASSWORD_REDIRECT_URL` (`.env`)**: Make sure it points to `http://localhost:5173/reset-password` so the email link opens the React reset page directly.
- **`SERVER_URL` (`.env`)**: Ensure `SERVER_URL` is set (e.g., `http://localhost:3000`) so task attachment URLs resolve properly in `<img>` and download links.
