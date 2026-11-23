# Backend Implementation Guide (Step-by-Step Approach)

This guide documents the step-by-step engineering workflow used to design, build, and harden the backend API from scratch.

---

## Step 1: Project Initialization & App Bootstrap
1. Initialize Node with `"type": "module"` in `backend/package.json` and install core packages: `express`, `mongoose`, `dotenv`, `cors`, `cookie-parser`, `bcrypt`, `jsonwebtoken`, `express-validator`, `multer`, `mailgen`, `nodemailer`, and `nodemon`.
2. Create `src/db/db.js` to connect to `process.env.MONGODB_URL` with clean failure exit (`process.exit(1)`).
3. Create `src/app.js` with:
   - `express.json({ limit: "16kb" })`, `express.urlencoded({ extended: true })`, `express.static(path.resolve(import.meta.dirname, "../public"), { maxAge: "7d", etag: true })`, `cookieParser()`.
   - `cors({ origin, credentials: true, methods, allowedHeaders })`.
   - Route mounts under `/api/v1/*`.
   - **Global JSON error-handling middleware** `(err, req, res, next)` at the very bottom so thrown `apiError` instances return structured JSON instead of HTML `500` pages.
4. Create `src/index.js` to load `.env`, connect MongoDB, and start listening on `PORT`.

---

## Step 2: Shared Utilities & Constants
Build foundational helpers before writing business logic:
- `src/utils/api-error.js`: Custom `apiError extends Error` carrying `statusCode`, `message`, `errors`, `success: false`, `data: null`.
- `src/utils/api-response.js`: Standardized `apiResponse(statusCode, data, message)` envelope.
- `src/utils/async-handler.js`: Wraps async route handlers to forward rejections to `next(err)`.
- `src/utils/constants.js`: Single source of truth for enums (`userRolesEnum`, `taskStatus`, `memberStatusEnum`) and their `Object.values(...)` arrays.
- `src/utils/mail.js`: Mailgen templates (`emailVerificationMailgenContent`, `forgotPasswordMailgenContent`) + Nodemailer `sendMail` using `generatePlaintext` for `text` and `generate` for `html`.
- `src/utils/imagekit.js`: Lazy-initialized ImageKit SDK client (`uploadFileToImageKit`, `uploadFilesToImageKit`, `deleteFilesFromImageKit`) reading `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT`.

---

## Step 3: Mongoose Models
Define schemas with proper references, trimming, and timestamps:
1. `user.model.js`: Add `pre("save")` hook using **`await bcrypt.hash(...)`**, plus instance methods `isPasswordValid`, `generateAccessToken`, `generateRefreshToken`, and `generateTemporaryToken` (SHA-256 hashed tokens with 20-minute expiry).
2. `project.model.js`: Project `name`, `description`, `createdBy`.
3. `projectMember.model.js`: Join model linking `user` + `project` with `role`, `status` (`"pending"` / `"accepted"`), and `invitedBy`.
4. `task.model.js`: `name`, `content`, `status`, `assignedTo`, `assignedBy`, `project`, and `attatchments[]`.
5. `subTask.model.js`: `title`, `content`, `task`.
6. `note.model.js`: `title`, `project`, `createdBy`.

---

## Step 4: Middleware Layer
Build composable middlewares so controllers stay focused on business logic:
1. **`verifyJWT`** (`auth.middleware.js`): Reads token from `req.cookies?.accessToken` or `req.header("Authorization")?.replace("Bearer ", "")`, verifies JWT, attaches sanitized `req.user`.
2. **`validateProjectPermission(roles)`**:
   - Returns an async Express middleware (`return async (req, res, next) => { ... }`).
   - Validates `projectId` ObjectId.
   - Queries `projectMember` with `status: { $ne: memberStatusEnum.PENDING }` — blocking pending invitees from viewing any project data!
   - Sets `req.user.role` and checks `roles.includes(givenRole)`.
3. **`validateTaskPermission(allowedRoles, { allowAssignee })`**:
   - Confirms `:taskId` belongs to `:projectId`, attaches `req.task`, and allows either matching roles or (when enabled) the task's `assignedTo` user.
4. **`validateNotePermission(allowedRoles)`**:
   - Confirms `:noteId` belongs to `:projectId`, attaches `req.note`, and allows only `foundNote.createdBy === req.user._id` (plus optional `allowedRoles`).
5. **`upload`** (`multer.middleware.js`): Uses `multer.memoryStorage()` with a 5 MB per-file limit so file buffers stream straight to ImageKit without writing temporary files to disk.
6. **`validate`** (`validator.middleware.js`) + **`src/validators/index.js`**: Express-validator chains using `.notEmpty()` (never `.isEmpty()`) and `validate` throwing `422` with extracted `{ [field]: message }` pairs.

---

## Step 5: Authentication Module
Implement `auth.controller.js` + `auth.route.js`:
1. `registerUser` → check duplicate username/email (`409`), create user, generate hashed email verification token, send Mailgen email.
2. `login` → verify password, rotate tokens, set cookies with `httpOnly: true` and `secure: process.env.NODE_ENV === "production"` (so `http://localhost` works in dev).
3. `verifyEmail` & `resendEmailVerification` → hash incoming token with `crypto`, flip `isEmailVerified = true`.
4. `refreshAccessToken` → validate refresh cookie/body against DB, rotate both tokens.
5. `forgotPasswordRequest`, `resetForgotPassword`, `changeCurrentPassword`, `getCurrentUser`, `logoutUser`.
6. Protect secured routes (`/logout`, `/current-user`, `/change-password`, `/resend-email-verification`) with `verifyJWT`.

---

## Step 6: Projects, Members & In-App Invitations
Implement `project.controller.js` + `project.route.js`:
1. `createProject` → creates project and immediately inserts the creator into `projectMember` with `role: "admin"` and `status: "accepted"`.
2. `getProjects` → aggregates `projectMember` filtering `status: { $ne: "pending" }`, looks up `projects` + accepted `projectmembers` count (`$size` inside the lookup pipeline), unwinds, and projects cleanly.
3. `addMembersToProject` → checks if user is already an accepted member (`409`); otherwise upserts a `pending` invitation storing `invitedBy: req.user._id`.
4. `getMyInvitations`, `acceptInvitation`, `rejectInvitation` → mount `/invitations*` routes **before** `/:projectId` so Express never treats `"invitations"` as a `projectId`.
5. `getProjectMembers`, `updateMemberRole`, `deleteMember`, `getProjectId`, `updateProject`, `deleteProject`.

---

## Step 7: Tasks & Subtasks Module
Implement `task.controller.js` + `task.route.js`:
1. Initialize router with `Router({ mergeParams: true })` so `:projectId` from `app.use("/api/v1/projects/:projectId/tasks", taskRouter)` is available in `req.params`.
2. Lock down permissions per route:
   - `POST /`, `PUT /:taskId`, `DELETE /:taskId` → `ADMIN` only (with `upload.array("attachments")` before validators on `POST` and `PUT`).
   - `PATCH /:taskId/status` → `ADMIN`, `PROJECT_ADMIN`, or task assignee (`allowAssignee: true`), updating **only** `{ $set: { status } }`.
   - `POST / PUT / DELETE` subtasks → `ADMIN` and `PROJECT_ADMIN` only.
3. Use MongoDB aggregation in `getTaskId` and `getSubTask` to join `users` (`assignedTo`) and `subtasks` (`from: "subtasks"`).
4. Upload task attachments via `uploadFilesToImageKit(files, "/project-management/<projectId>/tasks")` in `createTask` and `updateTask`, storing `url`, `fileId`, and `thumbnailUrl`; clean up stored ImageKit files with `deleteFilesFromImageKit(fileIds)` inside `deleteTask`.

---

## Step 8: Personal Project Notes Module
Implement `note.controller.js` + `note.route.js`:
1. Mount at `/api/v1/projects/:projectId/notes` with `Router({ mergeParams: true })`.
2. `getAllNotes` → aggregates notes matching `{ createdBy: req.user._id, project: projectId }`, joins `users` and `projects`, sorts `createdAt: -1`.
3. `createNote` → saves `createdBy: req.user._id`.
4. `updateNote` & `deleteNote` → protected by `validateNotePermission()` using `findOneAndUpdate` / `findOneAndDelete`.

---

## Step 9: Verification & Pitfalls Checklist
Before connecting a frontend, verify:
- [ ] Every relative ESM import ends in `.js` (and `index.js` for folder imports).
- [ ] All `ObjectId` calls use `new mongoose.Types.ObjectId(...)` (required in Mongoose 9).
- [ ] No local `const` shadows an imported Mongoose model (`const foundTask = await task...`, never `const task = await task...`).
- [ ] Multi-field updates/deletes use `findOneAndUpdate` / `findOneAndDelete`, never `findByIdAndUpdate` / `findByIdAndDelete`.
- [ ] Run `node -e "import('./backend/src/app.js')"` to confirm zero module/schema boot errors.
- [ ] Verify Mailtrap SMTP connection with `transporter.verify()` and smoke-test endpoints via Postman/Thunder Client.
