// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../common/prisma.service';
import { EmailModule } from '../email/email.module'; // 👈

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    EmailModule, // 👈 dôležité: prístup k EmailService exportovanému z EmailModule
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
