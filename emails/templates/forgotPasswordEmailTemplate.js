export const forgotPasswordEmailTemplate = ({
  name,
  otp,
  title = "Reset Password BeeHive",
  subtitle = "Gunakan kode OTP berikut untuk mengatur ulang password kamu.",
}) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
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
                  <h1 style="color:#2f855a;">🐝 BeeHive</h1>

                  <h2 style="color:#2d3748;">
                    ${title}
                  </h2>

                  <p>${subtitle}</p>

                  <p>Halo <strong>${name}</strong>,</p>

                  <div style="margin:30px 0;">
                    <span style="
                      display:inline-block;
                      padding:15px 30px;
                      font-size:28px;
                      letter-spacing:6px;
                      background:#2f855a;
                      color:#ffffff;
                      border-radius:8px;
                    ">
                      ${otp}
                    </span>
                  </div>

                  <p>
                    Kode OTP ini berlaku selama <strong>10 menit</strong>.
                  </p>

                  <p style="color:#718096;font-size:13px;">
                    Jika kamu tidak meminta reset password, abaikan email ini.
                    Password kamu tidak akan berubah tanpa OTP ini.
                  </p>

                  <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;" />

                  <p style="font-size:12px;color:#a0aec0;">
                    © ${new Date().getFullYear()} BeeHive. All rights reserved.
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
