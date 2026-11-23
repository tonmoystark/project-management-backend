import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RegisterSuccess } from "@/components/auth/RegisterSuccess";

const RegisterPage = () => {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  if (registeredEmail) {
    return <RegisterSuccess email={registeredEmail} />;
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Start managing your projects, tasks, and team in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={setRegisteredEmail} />
    </AuthCard>
  );
};

export default RegisterPage;
