import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  providers: [EmailService],
  controllers: [EmailController], // 👈 toto pridaj
  exports: [EmailService],
})
export class EmailModule {}
