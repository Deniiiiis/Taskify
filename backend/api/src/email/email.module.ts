// src/email/email.module.ts
import { Global, DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailService } from './email.service';
import { RESEND_CLIENT, EMAIL_FROM_TOKEN } from './email.tokens';

@Global() // 👈 toto pridaj
@Module({})
export class EmailModule {
  static forRootAsync(): DynamicModule {
    return {
      module: EmailModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: RESEND_CLIENT,
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => {
            const key = cfg.get<string>('RESEND_API_KEY');
            return key ? new Resend(key) : null; // dev no-op
          },
        },
        {
          provide: EMAIL_FROM_TOKEN,
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) =>
            cfg.get<string>('EMAIL_FROM') ?? 'Taskify <no-reply@example.com>',
        },
        EmailService,
      ],
      exports: [EmailService], // 👈 exportujeme
    };
  }
}
