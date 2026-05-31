/**
 * Centralized, reusable, responsive HTML email templates for Mark Sorting System.
 * Tailored for modern appearance, compatibility with major email clients, and product branding.
 */

interface BaseTemplateOptions {
  title: string;
  previewText?: string;
  bodyHtml: string;
}

/**
 * Wraps content in the standard branding layout of Mark Sorting System
 */
export function getBaseTemplate({ title, previewText = '', bodyHtml }: BaseTemplateOptions): string {
  const currentYear = new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    /* Reset & base styles */
    body, table, td, a { text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f7f9fa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }
    
    /* Layout */
    .wrapper { width: 100%; table-layout: fixed; background-color: #f7f9fa; padding-bottom: 40px; padding-top: 40px; }
    .main-card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02); border: 1px solid #edf2f7; }
    
    /* Header & Branding */
    .header { background: linear-gradient(135deg, #ff6b00 0%, #ff3b00 100%); padding: 32px 40px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
    .logo-subtext { color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
    
    /* Content */
    .content { padding: 40px; line-height: 1.6; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; color: #4b5563; margin-top: 0; margin-bottom: 20px; }
    
    /* Buttons */
    .btn-container { margin: 32px 0; text-align: center; }
    .btn { display: inline-block; background-color: #ff6b00; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 10px 20px -8px rgba(255,107,0,0.3); transition: all 0.2s ease; }
    
    /* Card/Details section */
    .detail-box { background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px dashed #e2e8f0; margin-bottom: 24px; font-family: monospace; font-size: 14px; color: #475569; word-break: break-all; }
    
    /* Footer */
    .footer { text-align: center; padding: 24px 40px; font-size: 12px; color: #9ca3af; line-height: 1.5; }
    .footer a { color: #ff6b00; text-decoration: none; font-weight: 600; }
    
    /* Responsive tweaks */
    @media screen and (max-width: 600px) {
      .main-card { border-radius: 0; border: none; }
      .content { padding: 24px; }
      .header { padding: 24px; }
    }
  </style>
</head>
<body>
  ${previewText ? `<span style="display: none; max-height: 0px; overflow: hidden;">${previewText}</span>` : ''}
  <div class="wrapper">
    <div class="main-card">
      <div class="header">
        <div class="logo-text">MARK</div>
        <div class="logo-subtext">Sorting System</div>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p style="font-size: 12px; margin-bottom: 8px;">This is an automated security email from Mark Sorting System.</p>
        <p style="font-size: 12px; margin-bottom: 16px;">&copy; ${currentYear} <a href="https://promechindustries.com" target="_blank">Promech Industries</a>. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Returns HTML for the password reset email template
 */
export function getForgotPasswordTemplate(name: string, resetUrl: string, expiresInMinutes = 60): string {
  const bodyHtml = `
    <h1>Password Reset Request</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>We received a request to reset the password for your account on the <strong>Mark Sorting System</strong>. Click the button below to set a new password:</p>
    
    <div class="btn-container">
      <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
    </div>
    
    <p>This password reset link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not make this request, you can safely ignore this email — your password will remain secure.</p>
    
    <p>If you have trouble clicking the button, copy and paste the URL below into your browser:</p>
    <div class="detail-box">
      ${resetUrl}
    </div>
    
    <p>Best regards,<br><strong>Mark Sorting System Team</strong></p>
  `;

  return getBaseTemplate({
    title: 'Reset Password - Mark Sorting System',
    previewText: 'Reset the password for your Mark Sorting System account.',
    bodyHtml,
  });
}
