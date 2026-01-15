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
        © ${new Date().getFullYear()} BeeVra. All rights reserved.
      </div>

    </div>
  </div>
  `;
};

export const practitionerApprovedTemplate = ({ name }) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Akun Practitioner Disetujui</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="
              background:#ffffff;
              border-radius:10px;
              padding:30px;
              font-family:Arial,sans-serif;
            ">
              <tr>
                <td align="center">
                  <h1 style="color:#2f855a;">🐝 BeeVra</h1>

                  <h2 style="color:#2d3748;">
                    Akun Practitioner Disetujui
                  </h2>

                  <p>Halo <strong>${name}</strong>,</p>

                  <p>
                    Selamat 🎉  
                    Akun kamu sebagai <strong>Practitioner</strong> telah
                    <strong style="color:#38a169;">disetujui</strong>.
                  </p>

                  <div style="
                    margin:25px 0;
                    padding:15px;
                    background:#f0fff4;
                    border-left:5px solid #38a169;
                    text-align:left;
                  ">
                    Kamu sekarang dapat mengakses seluruh fitur practitioner di BeeVra.
                  </div>

                  <p>
                    Silakan login ke aplikasi BeeVra untuk mulai menggunakan layanan.
                  </p>

                  <p style="font-size:13px;color:#718096;">
                    Jika kamu merasa tidak melakukan pendaftaran, silakan abaikan email ini.
                  </p>

                  <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;" />

                  <p style="font-size:12px;color:#a0aec0;">
                    © ${new Date().getFullYear()} BeeVra. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const practitionerRejectedTemplate = ({ name, reason }) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Pendaftaran Practitioner Ditolak</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="
              background:#ffffff;
              border-radius:10px;
              padding:30px;
              font-family:Arial,sans-serif;
            ">
              <tr>
                <td align="center">
                  <h1 style="color:#e53e3e;">🐝 BeeVra</h1>

                  <h2 style="color:#2d3748;">
                    Pendaftaran Practitioner Ditolak
                  </h2>

                  <p>Halo <strong>${name}</strong>,</p>

                  <p>
                    Terima kasih telah mendaftar sebagai <strong>Practitioner</strong> di BeeVra.
                  </p>

                  <div style="
                    margin:25px 0;
                    padding:15px;
                    background:#fff5f5;
                    border-left:5px solid #e53e3e;
                    text-align:left;
                  ">
                    <strong>Alasan penolakan:</strong>
                    <br />
                    ${reason}
                  </div>

                  <p>
                    Kamu dapat mendaftar kembali di kemudian hari setelah memenuhi persyaratan.
                  </p>

                  <p style="font-size:13px;color:#718096;">
                    Jika kamu merasa ini adalah kesalahan, silakan hubungi tim BeeVra.
                  </p>

                  <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;" />

                  <p style="font-size:12px;color:#a0aec0;">
                    © ${new Date().getFullYear()} BeeVra. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
