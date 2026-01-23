export const speciesUpdatedTemplate = ({
  adminName,
  editorName,
  editorEmail,
  speciesName,
  changes,
  updatedAt,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #2c3e50;"> Perubahan Data Spesies Lebah</h2>

      <p>Halo <strong>${adminName}</strong>,</p>

      <p>
        Terdapat pembaruan data spesies lebah yang dilakukan oleh
        <strong>${editorName}</strong> (${editorEmail}).
      </p>

      <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse;">
        <thead style="background-color: #f4f6f8;">
          <tr>
            <th align="left">Field</th>
            <th align="left">Nilai Lama</th>
            <th align="left">Nilai Baru</th>
          </tr>
        </thead>
        <tbody>
          ${changes
            .map(
              (c) => `
            <tr>
              <td>${c.field}</td>
              <td>${c.oldValue ?? "-"}</td>
              <td>${c.newValue ?? "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <p style="margin-top: 16px;">
        <strong>Nama Spesies:</strong> ${speciesName}<br/>
        <strong>Waktu Update:</strong> ${updatedAt}
      </p>

      <hr />

      <p style="font-size: 12px; color: #374151;">
        Email ini dikirim otomatis oleh sistem BeeVra.<br/>
        Silakan login ke dashboard admin untuk detail lebih lanjut.
      </p>
    </div>
  `;
};
