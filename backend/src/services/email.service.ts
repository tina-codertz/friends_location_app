/**
 * Email Service - Send emails via Resend API
 */

export interface EmailServiceConfig {
  apiKey: string;
}

export class EmailService {
  private apiKey: string;
  private resendApiUrl = 'https://api.resend.com/emails';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Send OTP email
   */
  async sendOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        console.warn('RESEND_API_KEY not configured');
        return {
          success: false,
          message: 'Email service not configured',
        };
      }

      const response = await fetch(this.resendApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your Connekta Verification Code',
          html: this.getOTPEmailTemplate(otp),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return {
          success: false,
          message: `Failed to send OTP: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log(`[EMAIL] OTP sent to ${email}, Message ID:`, data.id);

      return {
        success: true,
        message: 'OTP sent to your email',
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP email',
      };
    }
  }

  /**
   * OTP email template
   */
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
              <h1>Connekta Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your verification code is:</p>
              <div class="otp">${otp}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
              <div class="footer">
                <p>© 2026 Connekta. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
