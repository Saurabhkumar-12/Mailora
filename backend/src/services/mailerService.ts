import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export class MailerService {
  private static transporter: Transporter | null = null;

  /**
   * Initializes or gets the Nodemailer SMTP transporter.
   * Auto-creates an Ethereal test account if credentials are not specified in environment.
   */
  private static async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    let user = env.SMTP_USER;
    let pass = env.SMTP_PASS;

    if (!user || !pass) {
      console.log('ℹ️ No SMTP_USER/SMTP_PASS in env. Auto-generating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log(`✅ Ethereal test account created for user: ${user}`);
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.ethereal.email',
      port: env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  /**
   * Sends an email via Nodemailer + Ethereal SMTP.
   */
  static async sendMail(options: SendMailOptions) {
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: options.from || env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.body.replace(/\n/g, '<br/>'),
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log(`✉️ Email delivered to ${options.to}. Ethereal Preview: ${previewUrl}`);
    } else {
      console.log(`✉️ Email delivered to ${options.to}. Message ID: ${info.messageId}`);
    }

    return {
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  }
}
