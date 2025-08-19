import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

// 👇 exportni si typ, aby TS vedel s nim pracovať aj mimo tohto súboru
export interface ResendResponse {
  id?: string;
  error?: { message: string };
}

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private resend: Resend | null;
  private from: string;

  constructor() {
    const key = process.env.RESEND_API_KEY ?? '';
    this.from = process.env.EMAIL_FROM ?? 'Taskify <no-reply@example.com>';

    if (!key) {
      this.log.warn(
        'RESEND_API_KEY nie je nastavený – e-maily sa NEPOSIELAJÚ (dev no-op).',
      );
      this.resend = null;
    } else {
      this.resend = new Resend(key);
    }
  }

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ResendResponse> {
    if (!this.resend) {
      // Dev režim: len zaloguj, že „posielame“
      this.log.debug(
        `DEV EMAIL → to=${to} subject="${subject}" (no-op)\n${html}`,
      );
      return { id: 'dev-simulated' };
    }

    const res = (await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    })) as ResendResponse;

    if (res.error) {
      throw new Error(`Resend error: ${res.error.message}`);
    }
    return res;
  }
}
