import transporter from './mailer.js';

export async function sendInvitationEmail({ toEmail, toName, projectName, invitedByName }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await transporter.sendMail({
    from: `"Ralus" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Te han invitado a un proyecto en Ralus',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:32px;text-align:center;">
              <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Ralus</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">
                ¡Hola, ${toName}!
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#111827;">${invitedByName}</strong> te invitó a colaborar
                en el proyecto <strong style="color:#111827;">${projectName}</strong> en Ralus.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#111827;border-radius:8px;">
                    <a href="${appUrl}"
                       style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                      Abrir Ralus →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Si no reconoces este correo puedes ignorarlo. Nadie más puede acceder
                a tu cuenta sin tu contraseña.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                © ${new Date().getFullYear()} Ralus · Gestión de proyectos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
