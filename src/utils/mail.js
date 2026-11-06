import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Management App",
      link: "https://taskmanagerlink.com",
    },
  });

  const emailTextual = mailGenerator.generate(options.mailgenContent);

  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_SMTP_HOST,
    port: process.env.NODEMAILER_SMTP_PORT,
    auth: {
      user: process.env.NODEMAILER_SMTP_USER,
      pass: process.env.NODEMAILER_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.projectmanagerv@example.com", // sender address
    to: options.email, // list of recipients
    subject: options.email, // subject line
    text: emailTextual, // plain text body
    html: emailHtml, // HTML body
  };
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log("email service failed");
  }
};

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

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendMail,
};
