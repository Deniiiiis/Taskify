import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // hľadá .env v aktuálnom priečinku aj vyššie (prispôsobené tvojej štruktúre)
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    EmailModule,
    AuthModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
