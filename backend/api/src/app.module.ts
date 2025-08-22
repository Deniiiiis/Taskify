// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    EmailModule.forRootAsync(), // 👈 nakonfigurovaný email modul (Resend)
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
