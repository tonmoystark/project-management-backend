import { Link, useLocation, useNavigate, type Location } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

interface LocationState {
  from?: Location;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname || "/projects";

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your projects and tasks."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
    </AuthCard>
  );
};

export default LoginPage;
