import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface SendMailResult {
  messageId: string;
  previewUrl: string | null;
  accepted: string[];
  rejected: string[];
  response: string;
}

export interface SMTPVerifyResult {
  ok: boolean;
  message: string;
  provider: 'ethereal';
}

export class MailerService {
  private static transporter: Transporter | null = null;

  static resetTransporter(): void {
    this.transporter = null;
  }

  private static async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    let user = env.SMTP_USER;
    let pass = env.SMTP_PASS;

    if (!user || !pass) {
      console.log('ℹ️ No SMTP_USER/SMTP_PASS found. Creating dynamic Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log(`✅ Ethereal test account provisioned: ${user}`);
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  static async verifyConnection(): Promise<SMTPVerifyResult> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();

      return {
        ok: true,
        message: 'SMTP configured correctly',
        provider: 'ethereal',
      };
    } catch (error) {
      const safeMsg =
        error instanceof Error ? error.message : 'Unknown connection error';

      console.error('[SMTP Verification Error]', safeMsg);

      return {
        ok: false,
        message: 'SMTP connection unavailable',
        provider: 'ethereal',
      };
    }
  }

  static async sendMail(
    options: SendMailOptions,
  ): Promise<SendMailResult> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: options.from || env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.body.replace(/\n/g, '<br/>'),
    });

    const rawPreview = nodemailer.getTestMessageUrl(info);
    const previewUrl =
      typeof rawPreview === 'string' ? rawPreview : null;

    if (previewUrl) {
      console.log(
        `Email accepted for ${options.to}. Ethereal preview available.`,
      );
    } else {
      console.log(
        `Email accepted by SMTP server for ${options.to}. Message ID: ${info.messageId}`,
      );
    }

    return {
      messageId: info.messageId,
      previewUrl,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || '250 OK',
    };
  }
}