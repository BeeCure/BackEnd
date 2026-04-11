import { sendEmail } from "./emailService.js";
import {
  otpEmailTemplate,
  practitionerApprovedTemplate,
  practitionerRejectedTemplate,
} from "./templates/otpEmailTemplate.js";

export const sendVerificationOtpEmail = async (email, name, otp) => {
  const html = otpEmailTemplate({
    name,
    otp,
    title: "Verifikasi Email BeeVra",
    subtitle: "Gunakan kode OTP berikut untuk memverifikasi email kamu.",
  });

  await sendEmail({
    to: email,
    subject: "Kode OTP Verifikasi Email BeeVra",
    html,
  });
};

export const sendPractitionerApprovedEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: "Akun Practitioner BeeVra Disetujui",
    html: practitionerApprovedTemplate({ name }),
  });
};

export const sendPractitionerRejectedEmail = async (email, name, reason) => {
  await sendEmail({
    to: email,
    subject: "Pendaftaran Practitioner BeeVra Ditolak",
    html: practitionerRejectedTemplate({ name, reason }),
  });
};
