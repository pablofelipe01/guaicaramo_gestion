import nodemailer from 'nodemailer'

function getTransporter() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) throw new Error('SMTP_USER y SMTP_PASS son requeridos en .env.local')
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
}

export async function sendResetCodeEmail(to: string, code: string): Promise<void> {
  const from = process.env.SMTP_FROM ?? `Guaicaramo SG-SST <${process.env.SMTP_USER}>`
  const transporter = getTransporter()

  await transporter.sendMail({
    from,
    to,
    subject: 'Código de recuperación de contraseña — Guaicaramo',
    text: `Tu código de verificación es: ${code}\n\nVigencia: 10 minutos.\nSi no solicitaste este cambio, ignora este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #166534; margin: 0; font-size: 22px;">Guaicaramo</h1>
          <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">Sistema de Gestión SG-SST</p>
        </div>
        <div style="background: #ffffff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
          <p style="color: #111827; font-size: 15px; margin: 0 0 16px;">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="
              display: inline-block;
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 10px;
              color: #166534;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-radius: 10px;
              padding: 12px 24px;
            ">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
            Válido por <strong>10 minutos</strong>.<br/>
            Si no solicitaste este cambio, ignora este correo.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
          © 2026 Guaicaramo. Todos los derechos reservados.
        </p>
      </div>
    `,
  })
}
