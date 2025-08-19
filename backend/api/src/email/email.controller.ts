// src/email/email.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('test')
  async test(@Body('to') to: string) {
    return this.email.send(
      to,
      'Hello from Taskify 🚀',
      '<p>Toto je testovací email – ak si ho dostal, všetko funguje!</p>',
    );
  }
}
