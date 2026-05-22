
export interface EmailServiceConfig {
  apiKey: string;
  /** e.g. "Connekta <noreply@yourdomain.com>" — must use a verified domain in production */
  from?: string;
}

interface ResendErrorBody {
  message?: string;
  name?: string;
}

export class EmailService {
  private apiKey: string;
  private from: string;
  private resendApiUrl = 'https://api.resend.com/emails';

  constructor(config: EmailServiceConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.from = 'Connekta <onboarding@resend.dev>';
    } else {
      this.apiKey = config.apiKey;
      this.from = config.from?.trim() || 'Connekta <onboarding@resend.dev>';
    }
  }

  /**
   * Send OTP email via Resend.
   * Note: onboarding@resend.dev only delivers to your Resend account email until you verify a domain.
   */
  async sendOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey?.trim()) {
        console.error('[EMAIL] RESEND_API_KEY not configured on worker');
        return {
          success: false,
          message: 'Email service is not configured. Contact support.',
        };
      }

      const to = email.trim().toLowerCase();
      const response = await fetch(this.resendApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject: 'Your Connekta verification code',
          html: this.getOTPEmailTemplate(otp),
        }),
      });

      const raw = await response.text();
      let parsed: ResendErrorBody & { id?: string } = {};
      try {
        parsed = raw ? (JSON.parse(raw) as ResendErrorBody & { id?: string }) : {};
      } catch {
        parsed = { message: raw };
      }

      if (!response.ok) {
        const detail = parsed.message || response.statusText || 'Unknown error';
        console.error('[EMAIL] Resend API error:', response.status, detail, { to, from: this.from });

        if (
          response.status === 403 &&
          (detail.includes('only send') || detail.includes('verified') || detail.includes('testing'))
        ) {
          return {
            success: false,
            message:
              'We can only send verification email to your Resend account email until you verify a domain. Use that email to test, or add RESEND_FROM_EMAIL on the worker after verifying your domain at resend.com.',
          };
        }

        return {
          success: false,
          message: `Could not send verification email: ${detail}`,
        };
      }

      console.log(`[EMAIL] OTP sent to ${to}, id=${parsed.id ?? 'n/a'}, from=${this.from}`);

      return {
        success: true,
        message: 'OTP sent to your email',
      };
    } catch (error) {
      console.error('[EMAIL] Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send verification email. Try again in a few minutes.',
      };
    }
  }

  private getOTPEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; text-align: center; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Connekta verification code</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your verification code is:</p>
              <div class="otp">${otp}</div>
              <p>This code expires in 10 minutes.</p>
              <p>If you did not request this, you can ignore this email.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Connekta</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
