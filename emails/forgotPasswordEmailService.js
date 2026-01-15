import { sendEmail } from "./emailService.js";
import { forgotPasswordEmailTemplate } from "./templates/forgotPasswordEmailTemplate.js";

export const sendForgotPasswordEmail = async (email, name, otp) => {
  const html = forgotPasswordEmailTemplate({
    name,
    otp,
  });

  await sendEmail({
    to: email,
    subject: "Reset Password BeeHive",
    html,
  });
};
