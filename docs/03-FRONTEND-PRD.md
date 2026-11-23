# Frontend Product Requirements Document (PRD)
## Project Management Web Application (React + TypeScript)

---

## 1. Overview & Goals

A responsive, role-aware **React + TypeScript** Single Page Application (SPA) built with **Vite** that connects to the Project Management REST API (`/api/v1`).

### Core Goals
- Deliver a smooth workspace for managing **Projects**, **Team Invitations & Members**, **Tasks (Board & List)**, **Subtasks**, and **Personal Project Notes**.
- Enforce role-aware UI controls that mirror backend RBAC (`admin`, `project_admin`, `member`, task assignee, pending invitee, and note creator).
- Provide seamless cookie-based JWT auth with automatic silent token refresh, email verification, password reset flows, and real-time-feeling in-app invitation notifications.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Framework & Build | React 19 + TypeScript + Vite 8 | Fast HMR, strict type safety, `@/*` path alias |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + shadcn design tokens + `clsx` / `tailwind-merge` | Responsive themeable UI with `cn()` |
| Routing | React Router v7 (`react-router-dom`) | Public/Protected guards & nested workspace routes |
| HTTP & Auth | Axios (`withCredentials: true`) | Cookie auth + queued `401` refresh-token interceptor |
| Server State | TanStack Query v5 (`@tanstack/react-query`) | Caching, invalidation, loading/error states, 30s invite polling |
| Client Auth State | React Context (`AuthContext` + `useAuth`) | Global session persistence & logout cleanup |
| Forms & Feedback | React Hook Form + Sonner + Lucide React + `date-fns` | Validation, server `422` field error mapping, toasts, icons |

---

## 3. UI Role & Permission Matrix

| Feature / UI Control | `admin` | `project_admin` | `member` (Assignee) | `member` (Non-Assignee) |
| :--- | :---: | :---: | :---: | :---: |
| Create a new project | Yes | Yes | Yes | Yes |
| Notification Bell (Accept / Decline invites) | Yes | Yes | Yes | Yes |
| View project workspace (Tasks / Members / Notes) | Yes | Yes | Yes | Yes |
| Settings tab (Edit / Delete project) | **Yes** | Hidden | Hidden | Hidden |
| "Add Member" (Send Invite) modal | **Yes** | **Yes** | Hidden | Hidden |
| Inline role change & Remove member | **Yes** | Hidden | Hidden | Hidden |
| "New Task", "Edit Task", "Delete Task" | **Yes** | Hidden | Hidden | Hidden |
| Task Status dropdown (`PATCH /:taskId/status`) | **Yes** | **Yes** | **Yes** | Hidden |
| Add / Edit / Delete Subtasks | **Yes** | **Yes** | Hidden | Hidden |
| Create / Edit / Delete **own** Notes | Yes | Yes | Yes | Yes |

---

## 4. Route Map

### Public Routes (`PublicRoute` — redirects to `/projects` if logged in)
- `/login` — Sign in
- `/register` — Create account + "Check your email" confirmation
- `/forgot-password` — Request password reset email
- `/reset-password/:token` — Set new password

### Hybrid Route (Accessible logged in or logged out)
- `/verify-email/:verificationToken` — Verifies token once (StrictMode-safe) & refreshes session

### Protected Routes (`ProtectedRoute` → `AppShell`)
- `/projects` — Projects dashboard (searchable cards + Create Project modal)
- `/projects/:projectId` (`ProjectWorkspaceLayout` with header, role badge & tabs):
  - `/projects/:projectId/tasks` — Tasks Board (Kanban) & List views
  - `/projects/:projectId/tasks/:taskId` — Task detail, status switcher, attachments, subtasks
  - `/projects/:projectId/members` — Team members table, Pending invite badges, Invite modal
  - `/projects/:projectId/notes` — Personal project notes grid & CRUD
  - `/projects/:projectId/settings` — Admin-only General Settings & Danger Zone
- `/profile` — Account info, verification badge/resend, Change Password form

---

## 5. Feature Requirements

### 5.1 Authentication & Session Handling
- Register (`username` 3–20 lowercase, `email`, `password` + confirmation) → shows email verification instructions.
- Login (`email`, `password`) → sets `httpOnly` cookies, hydrates `AuthContext`, redirects to originally requested route or `/projects`.
- Session persists on page reload via `GET /auth/current-user`.
- Axios `401` interceptor triggers a single `POST /auth/refresh-token` request, queues concurrent failed requests, retries them on success, or clears auth + React Query cache on failure.
- Unverified users see a dismissible `EmailVerifyBanner` with a "Resend email" action.
- Full Forgot Password, Reset Password, Verify Email, Change Password, and Logout flows.

### 5.2 In-App Project Invitations (Notification Bell)
- Sticky topbar includes `NotificationsBell` with a red unread badge showing the number of pending invitations (`useInvitations`, polling every 30s + refetch on window focus).
- Dropdown lists each pending invite with inviter name, project name, role badge, and relative timestamp.
- **Accept** calls `PATCH /projects/invitations/:id/accept`, refreshes projects + invitations, and opens the project immediately.
- **Decline** calls `PATCH /projects/invitations/:id/reject` and removes the notification.
- Pending users appear in the project's Members table with a `"Pending invite"` badge and are excluded from the Task Assignee dropdown until they accept.

### 5.3 Projects Dashboard & Workspace
- Searchable card grid showing project name, description, accepted member count, role badge, and created date.
- Create Project modal (`name`, `description`).
- Workspace header with back navigation, active role badge, and tabs (**Tasks**, **Members**, **Notes**, plus **Settings** for `admin`).
- Admin Settings page with Edit Project form and Delete confirmation modal.

### 5.4 Team Members
- Table displaying avatar, name, `"You"` / `"Pending invite"` badges, email, role, and join date.
- `admin` and `project_admin` can send invitations by email + role.
- `admin` can change roles inline (`Select`) and remove members / cancel pending invites.

### 5.5 Tasks, Attachments & Subtasks
- **Board (Kanban)** grouped by `todo`, `in_progress`, and `done`, plus a **List** table toggle.
- Client-side search, status filter, and assignee filter.
- **Create / Edit Task Modal (`admin` only)**: title, description, status, accepted-member assignee dropdown, multi-file upload enforcing the 1 MB per-file Multer limit.
- **Task Detail Page**:
  - Quick status selector (`PATCH /:taskId/status`) for `admin`, `project_admin`, and the assigned `member`.
  - Edit & Delete controls for `admin` only.
  - Attachments gallery (image thumbnails for `image/*`, file cards for documents) opening in a new tab.
  - **Subtasks Section**: inline Add, Edit, and Delete for `admin` and `project_admin`; read-only for `member`.

### 5.6 Personal Project Notes
- Searchable card grid of private notes created by the logged-in user in the active project.
- Create, Edit, and Delete modals with created/edited timestamps.

---

## 6. Frontend Architecture

```text
frontend/src/
├── api/            # axios.ts, auth.api.ts, project.api.ts, task.api.ts, note.api.ts
├── components/
│   ├── ui/         # Button, Input, PasswordInput, Textarea, Select, FormField, Modal, RoleBadge
│   ├── layout/     # AppShell, EmailVerifyBanner, NotificationsBell
│   ├── auth/       # AuthCard, LoginForm, RegisterForm, RegisterSuccess, ForgotPasswordForm, ResetPasswordForm
│   ├── profile/    # ChangePasswordForm
│   ├── projects/   # ProjectCard, CreateProjectModal, ProjectWorkspaceLayout
│   ├── members/    # MemberTable, AddMemberModal
│   ├── tasks/      # StatusBadge, TaskCard, KanbanBoard, TaskListTable, TaskFormModal, SubTaskSection
│   └── notes/      # NoteCard, NoteFormModal
├── context/        # AuthContext.tsx
├── hooks/          # useAuth.ts, useProjects.ts, useTasks.ts, useNotes.ts
├── lib/            # queryClient.ts, utils.ts
├── pages/          # auth/*, ProjectPage, ProjectTasksPage, TaskDetailPage, ProjectMembersPage, ProjectNotesPage, ProjectSettingPage, ProfilePage
├── routes/         # ProtectedRoute.tsx, PublicRoute.tsx
└── utils/          # constants.ts
```
