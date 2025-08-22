// src/email/email.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EMAIL_FROM_TOKEN, RESEND_CLIENT } from './email.tokens';

export interface ResendResponse {
  id?: string;
  error?: { message: string };
}

// helper na bezpečné získanie message bez `any`
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return String(e);
}

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);

  constructor(
    @Inject(RESEND_CLIENT) private readonly resend: Resend | null,
    @Inject(EMAIL_FROM_TOKEN) private readonly from: string,
  ) {}

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<ResendResponse> {
    if (!this.resend) {
      // Dev no-op: bez kľúča iba logujeme
      this.log.warn(
        'RESEND_API_KEY nie je nastavený – email sa NEPOSIELA (no-op).',
      );
      this.log.debug(`DEV EMAIL → to=${to} subject="${subject}"\n${html}`);
      return { id: 'dev-noop' };
    }

    const maxAttempts = 3;
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = (await this.resend.emails.send({
          from: this.from,
          to,
          subject,
          html,
        })) as ResendResponse;

        if (res?.error) {
          throw new Error(res.error.message);
        }

        this.log.log(`Email OK → to=${to} subj="${subject}" id=${res?.id}`);
        return res;
      } catch (err: unknown) {
        lastErr = err;
        this.log.error(
          `Email fail (attempt ${attempt}/${maxAttempts}) → ${errMsg(err)}`,
        );
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 300)); // backoff
        }
      }
    }

    throw new Error(`Email send failed: ${errMsg(lastErr)}`);
  }
}
