import { sendEmail } from "./emailService.js";
import { forgotPasswordEmailTemplate } from "./templates/forgotPasswordEmailTemplate.js";

export const sendForgotPasswordEmail = async ({ email, name, resetLink }) => {
  const html = forgotPasswordEmailTemplate({
    name,
    resetLink,
  });

  await sendEmail({
    to: email,
    subject: "Reset Password BeeVra",
    html,
  });
};
