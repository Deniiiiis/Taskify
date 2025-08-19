import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { EmailService } from '../email/email.service';
import { resetPasswordEmail, otpLoginEmail } from '../email/templates';
import * as crypto from 'crypto'; // dôležité: nie "default" import

const sha256 = (s: string) =>
  crypto.createHash('sha256').update(s).digest('hex');
const now = () => new Date();
// 6-ciferný kód, vždy s leading zeros
const gen6 = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // -------------------------
  // Register (dočasne bez verify)
  // -------------------------
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email už existuje');

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }

  // -------------------------
  // Forgot / Reset password
  // -------------------------
  async forgotPassword(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // neprezrádzaj, že neexistuje

    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        type: 'RESET_PASSWORD',
        tokenHash,
        sentTo: email,
        expiresAt,
      },
    });

    const link = `${process.env.FRONTEND_RESET_URL}?token=${raw}&email=${encodeURIComponent(
      email,
    )}`;
    await this.email.send(email, 'Reset hesla', resetPasswordEmail(link));
  }

  async resetPassword(emailRaw: string, rawToken: string, newPassword: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Neplatný token alebo e-mail');

    const token = await this.prisma.emailToken.findFirst({
      where: {
        userId: user.id,
        type: 'RESET_PASSWORD',
        tokenHash: sha256(rawToken),
        consumedAt: null,
        expiresAt: { gt: now() },
      },
    });
    if (!token)
      throw new BadRequestException('Neplatný alebo expirovaný token');

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.emailToken.update({
        where: { id: token.id },
        data: { consumedAt: now() },
      }),
    ]);
    return { ok: true };
  }

  // -------------------------
  // OTP LOGIN (jednorazový 6-ciferný kód)
  // -------------------------

  /**
   * Vygeneruje a odošle 6-ciferný kód (platí 10 min).
   * Rate-limit: ak bol naposledy poslaný pred < 60s, mlčky skončí.
   */
  async requestOtp(emailRaw: string): Promise<void> {
    const email = emailRaw.toLowerCase();

    // Cooldown: 60 sekúnd
    const recent = await this.prisma.emailToken.findFirst({
      where: { type: 'OTP_LOGIN', sentTo: email },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < 60_000) return;

    // Ak user neexistuje, vytvor ho (bez hesla)
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email } });
    }

    const code = gen6();
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        type: 'OTP_LOGIN',
        tokenHash: codeHash,
        codeHash,
        sentTo: email,
        expiresAt,
      },
    });

    await this.email.send(email, 'Váš prihlasovací kód', otpLoginEmail(code));
  }

  /**
   * Overí 6-ciferný kód a "consume" ho. Označí email ako overený.
   * (Neskôr tu rovno vrátime access/refresh JWT.)
   */
  async verifyOtp(emailRaw: string, code: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Neplatný e-mail alebo kód');

    const token = await this.prisma.emailToken.findFirst({
      where: {
        userId: user.id,
        type: 'OTP_LOGIN',
        codeHash: sha256(code),
        consumedAt: null,
        expiresAt: { gt: now() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) throw new BadRequestException('Neplatný alebo expirovaný kód');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: user.emailVerifiedAt ?? now() },
      }),
      this.prisma.emailToken.update({
        where: { id: token.id },
        data: { consumedAt: now() },
      }),
    ]);

    // TODO: doplniť vydanie JWT (access + refresh)
    return { ok: true, user: { id: user.id, email: user.email } };
  }
}
