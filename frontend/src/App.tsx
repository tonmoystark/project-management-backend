import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectWorkspaceLayout } from "@/components/projects/ProjectWorkspaceLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";

import ProjectPage from "@/pages/ProjectPage";
import { ProjectTasksPage } from "@/pages/ProjectTasksPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import ProjectMembersPage from "@/pages/ProjectMembersPage";
import ProjectNotesPage from "@/pages/ProjectNotesPage";
import ProjectSettingPage from "@/pages/ProjectSettingPage";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPasswordPage />}
              />
            </Route>

            {/* Accessible whether logged in or not */}
            <Route
              path="/verify-email/:verificationToken"
              element={<VerifyEmailPage />}
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/projects" element={<ProjectPage />} />
                <Route
                  path="/projects/:projectId"
                  element={<ProjectWorkspaceLayout />}
                >
                  <Route index element={<Navigate to="tasks" replace />} />
                  <Route path="tasks" element={<ProjectTasksPage />} />
                  <Route path="tasks/:taskId" element={<TaskDetailPage />} />
                  <Route path="members" element={<ProjectMembersPage />} />
                  <Route path="notes" element={<ProjectNotesPage />} />
                  <Route path="settings" element={<ProjectSettingPage />} />
                </Route>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Default & fallback */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>

          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
