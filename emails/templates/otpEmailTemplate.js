export const otpEmailTemplate = ({ name, otp, title, subtitle }) => {
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
          🐝 BeeHive
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
          Selamat Datang <strong>${name}</strong>!!,
        </p>

        <p style="color:#374151;font-size:14px;">
          ${subtitle}
        </p>

        <!-- OTP Box -->
        <div style="
          margin:30px 0;
          text-align:center;
        ">
          <div style="
            display:inline-block;
            padding:15px 30px;
            font-size:28px;
            letter-spacing:6px;
            font-weight:bold;
            color:#111827;
            background:#fef3c7;
            border-radius:8px;
          ">
            ${otp}
          </div>
        </div>

        <p style="
          color:#6b7280;
          font-size:13px;
          text-align:center;
        ">
          Kode ini berlaku selama <strong>10 menit</strong>.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;" />

        <p style="
          color:#9ca3af;
          font-size:12px;
          text-align:center;
        ">
          Jika kamu tidak merasa mendaftar atau meminta OTP, abaikan email ini.
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
        © ${new Date().getFullYear()} BeeHive. All rights reserved.
      </div>

    </div>
  </div>
  `;
};
