import crypto from "crypto";

export interface SendOtpResult {
  success: boolean;
  code?: string;
  error?: string;
  isSimulated?: boolean;
}

// Typo domain checker to protect users from mistakes like 'gmial.com'
const TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yaho.com": "yahoo.com",
};

export function validateEmailWithTypoCheck(email: string): { valid: boolean; suggestion?: string; error?: string } {
  const trimmed = email.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) {
    return { valid: false, error: "Formato de correo electrónico inválido." };
  }

  const parts = trimmed.split("@");
  const domain = parts[1];
  if (TYPO_DOMAINS[domain]) {
    return {
      valid: false,
      suggestion: `${parts[0]}@${TYPO_DOMAINS[domain]}`,
      error: `¿Quisiste escribir @${TYPO_DOMAINS[domain]} en vez de @${domain}? Revisa antes de continuar.`,
    };
  }

  return { valid: true };
}

export function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendOtpEmail(email: string, code: string): Promise<SendOtpResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Geologgia Empleos <onboarding@resend.dev>";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Código de Verificación - Geologgia Empleos</title>
    </head>
    <body style="background-color: #0a0a0a; color: #ededed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #11141a; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 16px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px;">
            <span style="font-size: 13px; font-weight: 700; color: #f59e0b; letter-spacing: 0.05em; text-transform: uppercase;">
              🧭 GEOLOGGIA EMPLEOS
            </span>
          </div>
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 16px 0 8px 0;">
            Tu Código de Seguridad
          </h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">
            Ingresa este código de 6 dígitos para validar tu correo y acceder a tu perfil profesional.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background-color: #1a2230; border: 2px dashed #f59e0b; border-radius: 8px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #fbbf24; font-family: monospace;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 10px;">
            Válido durante <strong>10 minutos</strong>.
          </p>
        </div>

        <div style="background-color: #0b0e14; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; font-size: 12px; color: #94a3b8; margin-top: 24px;">
          <p style="margin: 0; line-height: 1.4;">
            🔒 <strong>Seguridad Geologgia:</strong> Si tú no solicitaste este código, puedes ignorar este mensaje de forma segura. Nadie puede acceder a tu perfil sin este número.
          </p>
        </div>

        <div style="text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b; color: #475569; font-size: 11px;">
          Geologgia Empleos · Geociencias & Minería Chile<br>
          <a href="https://empleos.geologgia.cl" style="color: #38bdf8; text-decoration: none;">empleos.geologgia.cl</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `🔑 ${code} es tu código de acceso a Geologgia Empleos`,
          html: htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Resend API error:", data);
        return { success: false, error: data.message || "Error al enviar correo por Resend." };
      }

      return { success: true, code };
    } catch (err: any) {
      console.error("Failed to connect to Resend API:", err);
      return { success: false, error: err.message || "Fallo de conexión al enviar correo." };
    }
  }

  // Fallback: If RESEND_API_KEY is not configured yet in environment,
  // return simulated success so the developer/user can test seamlessly.
  console.log(`[SIMULACIÓN OTP] Enviado a ${email}: Código ${code}`);
  return {
    success: true,
    code,
    isSimulated: true,
  };
}
