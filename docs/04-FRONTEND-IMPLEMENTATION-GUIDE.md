# Frontend Implementation Guide (Step-by-Step Approach)

This guide explains how to approach building the React + TypeScript frontend cleanly from setup to end-to-end verification, one layer at a time.

---

## Step 1: Project Setup & Tooling Configuration
1. Scaffold Vite + React + TypeScript inside `frontend/`.
2. Install dependencies:
   - Core: `react-router-dom`, `axios`, `@tanstack/react-query`
   - Forms & UX: `react-hook-form`, `sonner`, `lucide-react`, `date-fns`
   - Styling: `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`
3. Configure path alias `@/*` → `./src/*`:
   - Add `"paths": { "@/*": ["./src/*"] }` in `tsconfig.json` and `tsconfig.app.json` (omit deprecated `baseUrl` for TypeScript 6).
   - Add `resolve: { alias: { "@": path.resolve(__dirname, "./src") } }` in `vite.config.ts`.
4. Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3000/api/v1`.
5. Configure Tailwind theme tokens in `src/index.css` and create `src/lib/utils.ts` exporting `cn(...)`.

---

## Step 2: Core Infrastructure (HTTP, Query Client, Constants)
Build the shared plumbing before any pages:
1. **`src/api/axios.ts`**:
   - Create `apiClient` with `baseURL` and `withCredentials: true`.
   - Define `ApiResponse<T>` and `ApiErrorResponse` matching the backend envelopes.
   - Add a `401` response interceptor with an `isRefreshing` flag + `failedQueue` so simultaneous `401` calls trigger only **one** `POST /auth/refresh-token` request and skip auth endpoints to avoid loops.
   - Export `setUnauthorizedHandler`, `getApiErrorMessage`, and `getApiFieldErrors` (converts backend `errors: [{ field: msg }]` to `{ [field]: msg }`).
2. **`src/lib/queryClient.ts`**: Create `QueryClient` with sensible `staleTime`, `gcTime`, and `refetchOnWindowFocus`.
3. **`src/utils/constants.ts`**: Mirror backend enums (`USER_ROLES`, `TASK_STATUSES`, `MEMBER_STATUSES`) and UI display labels.

---

## Step 3: Reusable UI Primitives (`src/components/ui/`)
Create small, composable primitives early so every feature shares consistent styling:
- `Button` (variants, sizes, `isLoading` + `loadingText`)
- `Input` & `Textarea` & `Select` (`forwardRef` so React Hook Form `register()` works cleanly, with `hasError` border styling)
- `PasswordInput` (wraps `Input` with show/hide eye toggle)
- `FormField` (label, optional `labelExtra` slot, hint, error message)
- `Modal` (Escape key + backdrop close, accessible `role="dialog"`)
- `RoleBadge` (color-coded pills for `admin`, `project_admin`, `member`)

---

## Step 4: Authentication & Routing Foundation (Phase 1)
1. **`src/api/auth.api.ts`**: Typed wrappers for all `/auth/*` endpoints.
2. **`src/context/AuthContext.tsx`** + **`src/hooks/useAuth.ts`**:
   - Fetch `GET /auth/current-user` on mount to persist session across refreshes.
   - Register `setUnauthorizedHandler` to clear `user` and `queryClient.clear()`.
   - Expose `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `refreshUser`.
3. **`ProtectedRoute.tsx` & `PublicRoute.tsx`**: Show loading spinner while verifying session; redirect unauthenticated users to `/login` (preserving `location` in state) and authenticated users away from `/login` to `/projects`.
4. **Auth Components & Pages**:
   - Shared `AuthCard` shell.
   - Split forms from pages (`RegisterForm` + `RegisterSuccess` → `RegisterPage`; `LoginForm` → `LoginPage`; `ForgotPasswordForm` → `ForgotPasswordPage`; `ResetPasswordForm` → `ResetPasswordPage`).
   - `VerifyEmailPage`: mount outside `PublicRoute` so it works logged in or out, and guard the `useEffect` call with a `useRef` so React 19 `StrictMode` doesn't consume the one-time token twice.
5. Wire `<QueryClientProvider>`, `<BrowserRouter>`, `<AuthProvider>`, `<Routes>`, and `<Toaster />` in `src/App.tsx`.

---

## Step 5: AppShell, Profile & In-App Notification Bell
1. **`EmailVerifyBanner.tsx`**: Show a dismissible warning banner for unverified users with a resend button.
2. **`NotificationsBell.tsx`**: Poll `GET /projects/invitations` every 30s (`useInvitations`), show unread badge count, and render Accept / Decline buttons inside a dropdown. On Accept, invalidate `projects` + `invitations` and navigate straight into the project.
3. **`AppShell.tsx`**: Sticky topbar with brand link, `Projects` nav link, `NotificationsBell`, user `/profile` link, and `Logout` button; wrap all protected routes in `App.tsx`.
4. **`ProfilePage.tsx`** + **`ChangePasswordForm.tsx`**: Display user details, verification status/resend button, and Change Password form.

---

## Step 6: Projects Dashboard, Workspace Layout & Settings (Phase 2)
1. **`project.api.ts`** & **`useProjects.ts`**: Define `projectKeys` (`all`, `invitations`, `detail`, `members`) and all project/invitation/member queries and mutations.
2. **`ProjectPage.tsx`** (`ProjectCard`, `CreateProjectModal`): Searchable grid with skeletons, empty state, error retry, and create modal.
3. **`ProjectWorkspaceLayout.tsx`**: Nested route layout for `/projects/:projectId/*` that fetches project details + resolves the user's `role`, renders tabs (**Tasks**, **Members**, **Notes**, and **Settings** for `admin` only), and passes `{ project, role }` down via `<Outlet context={...} />` (`useProjectWorkspace()`).
4. **`ProjectSettingPage.tsx`**: Admin-only guard, Edit Project form, and Danger Zone delete confirmation modal.

---

## Step 7: Team Members & Invitations (Phase 3)
1. **`AddMemberModal.tsx`**: Visible to `admin` and `project_admin`; sends pending invitations via `POST /projects/:projectId/members`.
2. **`MemberTable.tsx`**: Shows avatar, name, `"You"` badge, `"Pending invite"` badge for unaccepted invites, inline role `<Select>` for `admin` (hidden on own row), and remove/cancel confirmation modal.
3. **`ProjectMembersPage.tsx`**: Combines skeletons, error retry, empty state, and `MemberTable`.

---

## Step 8: Tasks, Attachments & Subtasks (Phase 4)
1. **`task.api.ts`** & **`useTasks.ts`**:
   - Send `FormData` with `{ headers: { "Content-Type": undefined } }` on `POST /` and `PUT /:taskId` so Axios/browser sets the multipart boundary for Multer's `attachments` field.
   - Add dedicated `updateStatus` calling `PATCH /:taskId/status`.
   - Add `createSubTask`, `updateSubTask`, `deleteSubTask`.
2. **`ProjectTasksPage.tsx`**:
   - Board (`KanbanBoard` + `TaskCard`) and List (`TaskListTable`) toggle, search, status filter, and assignee filter.
   - Show "New Task" button (`TaskFormModal`) to `admin` only; filter assignee dropdown to accepted members only; validate 1 MB max per file client-side.
3. **`TaskDetailPage.tsx`** + **`TaskAttachments.tsx`** + **`SubTaskSection.tsx`**:
   - Enforce the 3 distinct permission flags:
     - `canManipulateTask` (`admin`) → Edit & Delete task buttons.
     - `canChangeStatus` (`admin`, `project_admin`, or task assignee) → inline Status dropdown calling `useUpdateTaskStatus`.
     - `canManageSubTasks` (`admin` or `project_admin`) → inline Add / Edit / Delete subtasks.
   - Render `task.attatchments` via `TaskAttachments`: resolve relative URLs against the backend origin derived from `VITE_API_BASE_URL`, lazy-load `aspect-video` thumbnails with shimmer/fallback states, and provide a keyboard-accessible Lightbox viewer (Prev/Next, Escape, Download, Open in new tab).

---

## Step 9: Personal Project Notes (Phase 5)
1. **`note.api.ts`** & **`useNotes.ts`**: Query + Create/Update/Delete mutations invalidating `noteKeys.list(projectId)`.
2. **`NoteFormModal.tsx`**, **`NoteCard.tsx`**, & **`ProjectNotesPage.tsx`**: Searchable grid of the logged-in user's private notes with create, edit, and delete modals.

---

## Step 10: Verification & End-to-End Testing (Phase 6)
1. Run strict TypeScript check (`tsc -b --noEmit`) and production bundle (`vite build`) after every phase.
2. Test full multi-user scenarios across two browser sessions (e.g., normal + incognito):
   - **Account A (`admin`)**: Register → verify via Mailtrap → Login → Create Project → Invite Account B as `member` (and later test `project_admin`).
   - **Account B (before accepting)**: Confirm direct URL to `/projects/:projectId/tasks` is blocked (`403` / not found) and project is not on `/projects`.
   - **Account B (accepting)**: Open Notification Bell → click **Accept** → verify project unlocks immediately.
   - **Task & Subtask RBAC**:
     - `admin`: Create/Edit/Delete tasks, upload attachment, change status, CRUD subtasks.
     - `project_admin`: Confirm no Create/Edit/Delete task buttons, CAN change task status, CAN CRUD subtasks, CAN invite members, NO Settings tab.
     - `member` (assignee): Confirm CAN change status on own task, CANNOT edit/delete task, CANNOT CRUD subtasks.
     - `member` (non-assignee): Confirm read-only on tasks & subtasks, CAN create/edit/delete own private notes.
