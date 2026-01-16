export const forgotPasswordEmailTemplate = ({
  name,
  resetLink,
  title = "Reset Password BeeVra",
  subtitle = "Kami menerima permintaan untuk mengatur ulang password akun BeeVra kamu.",
}) => {
  return `
  <div style="
    background-color:#f4f6f8;
    padding:40px 0;
    font-family:Arial, Helvetica, sans-serif;
  ">
    <div style="
      max-width:520px;
      margin:0 auto;
      background:#ffffff;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 4px 12px rgba(0,0,0,0.08);
    ">
      
      <!-- Header -->
      <div style="
        background:#fbbf24;
        padding:20px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:#1f2937;
          font-size:22px;
          letter-spacing:1px;
        ">
          🐝 BeeVra
        </h1>
      </div>

      <!-- Content -->
      <div style="padding:30px;">
        <h2 style="
          margin-top:0;
          color:#111827;
          font-size:20px;
        ">
          ${title}
        </h2>

        <p style="color:#374151;font-size:14px;">
          Halo <strong>${name}</strong>,
        </p>

        <p style="color:#374151;font-size:14px;">
          ${subtitle}
        </p>

        <p style="color:#374151;font-size:14px;">
          Klik tombol di bawah ini untuk melanjutkan proses reset password.
        </p>

        <!-- CTA Button -->
        <div style="margin:30px 0;text-align:center;">
          <a href="${resetLink}" style="
            display:inline-block;
            padding:14px 28px;
            background:#fbbf24;
            color:#111827;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
            font-size:14px;
          ">
            Reset Password
          </a>
        </div>

        <!-- Fallback link -->
        <p style="
          font-size:13px;
          color:#6b7280;
          text-align:center;
          word-break:break-all;
        ">
          Jika tombol di atas tidak berfungsi, salin dan buka link berikut:
          <br />
          <a href="${resetLink}" style="color:#f59e0b;">
            ${resetLink}
          </a>
        </p>

        <p style="
          color:#6b7280;
          font-size:13px;
          text-align:center;
          margin-top:20px;
        ">
          Link ini berlaku selama <strong>15 menit</strong>.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;" />

        <p style="
          color:#9ca3af;
          font-size:12px;
          text-align:center;
        ">
          Jika kamu tidak meminta reset password, abaikan email ini.
        </p>
      </div>

      <!-- Footer -->
      <div style="
        background:#f9fafb;
        padding:15px;
        text-align:center;
        font-size:12px;
        color:#9ca3af;
      ">
        © ${new Date().getFullYear()} BeeVra. All rights reserved.
      </div>

    </div>
  </div>
  `;
};
