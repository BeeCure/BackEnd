import { sendEmail } from "./emailService.js";
import { otpEmailTemplate } from "./templates/otpEmailTemplate.js";

export const sendVerificationOtpEmail = async (email, name, otp) => {
  const html = otpEmailTemplate({
    name,
    otp,
    title: "Verifikasi Email BeeHive",
    subtitle: "Gunakan kode OTP berikut untuk memverifikasi email kamu.",
  });

  await sendEmail({
    to: email,
    subject: "Kode OTP Verifikasi Email BeeHive",
    html,
  });
};
