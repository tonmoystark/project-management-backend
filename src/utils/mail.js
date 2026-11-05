import Mailgen from "mailgen";

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro:
        "Welcome to our project management app! We're very excited to have you on board.",
      action: {
        instructions: "Click on the button below to verify your email address.",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Verify",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro:
        "Let's fix your password! We're very excited to have you on board.",
      action: {
        instructions: "Click on the button below to reset your password.",
        button: {
          color: "#22a2bc", // Optional action button color
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
