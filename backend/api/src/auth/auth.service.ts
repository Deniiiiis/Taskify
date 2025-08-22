// src/auth/auth.service.ts
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { EmailService } from '../email/email.service';
import {
  resetPasswordCodeEmail,
  otpLoginEmail,
  verifyEmailEmail,
} from '../email/templates';
import * as crypto from 'crypto';

type Tokens = { accessToken: string; refreshToken: string };
const sha256 = (s: string) =>
  crypto.createHash('sha256').update(s).digest('hex');
const now = () => new Date();
// 6-ciferný kód s leading zeros
const gen6 = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private email: EmailService,
  ) {}

  // =========================
  // JWT helpers (ACCESS/REFRESH)
  // =========================
  private async signAccessToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const secret =
      this.cfg.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret-change';
    const expiresIn = this.cfg.get<string>('JWT_ACCESS_TTL') ?? '15m';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  private async signRefreshToken(userId: string, email: string) {
    const payload = { sub: userId, email, typ: 'refresh' as const };
    const secret =
      this.cfg.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change';
    const expiresIn = this.cfg.get<string>('JWT_REFRESH_TTL') ?? '30d';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  async issueTokens(userId: string, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, email),
      this.signRefreshToken(userId, email),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyRefresh(refreshToken: string) {
    try {
      const secret =
        this.cfg.get<string>('JWT_REFRESH_SECRET') ??
        'dev-refresh-secret-change';
      const decoded = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        typ?: string;
      }>(refreshToken, { secret });
      if (decoded?.typ !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      // TODO: voliteľne kontrola revoke/rotation v DB podľa jti
      return decoded; // { sub, email, typ }
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

  // =========================================================
  // REGISTRÁCIA + VERIFIKÁCIA E-MAILU
  // =========================================================

  /**
   * Registrácia s kontrolou existencie e-mailu.
   * Po úspechu odošleme 6-ciferný verifikačný kód (platnosť 15 min).
   */
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email už existuje');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email, passwordHash },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    await this.issueAndSendVerifyCode(user.id, email);
    return { ok: true, user };
  }

  /**
   * Vygeneruje a uloží verifikačný kód pre e-mail (platnosť 15 min) a odošle ho mailom.
   * Zmaže staré nevyužité VERIFY_EMAIL tokeny, aby sa nehromadili.
   */
  private async issueAndSendVerifyCode(userId: string, email: string) {
    const code = gen6();
    const codeHash = sha256(code);

    // odstráň staré nevyužité verifikačné kódy
    await this.prisma.emailToken.deleteMany({
      where: { userId, type: 'VERIFY_EMAIL', consumedAt: null },
    });

    await this.prisma.emailToken.create({
      data: {
        userId,
        type: 'VERIFY_EMAIL',
        tokenHash: codeHash, // pre konzistenciu držíme aj tokenHash
        codeHash,
        sentTo: email,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    await this.email.send(email, 'Overenie e-mailu', verifyEmailEmail(code));
  }

  /**
   * Resend verifikačného kódu (ak už nie je overený).
   * Cooldown: ak posledný VERIFY_EMAIL bol poslaný pred < 60s, ticho skončí.
   */
  async resendVerifyEmail(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true }; // neprezrádzame existenciu
    if (user.emailVerifiedAt) return { ok: true }; // už overený

    const recent = await this.prisma.emailToken.findFirst({
      where: { userId: user.id, type: 'VERIFY_EMAIL' },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < 60_000) {
      return { ok: true }; // cooldown
    }

    await this.issueAndSendVerifyCode(user.id, email);
    return { ok: true };
  }

  /**
   * Overenie e-mailu pomocou 6-ciferného kódu.
   * Po úspechu nastaví emailVerifiedAt, consume-ne kód a vráti TOKENS.
   * Pri už overenom účte je funkcia idempotentná a tiež vráti TOKENS.
   */
  async verifyEmail(emailRaw: string, code: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Neplatný e-mail alebo kód');

    // Už overený? -> rovno prihlás (idempotentné)
    if (user.emailVerifiedAt) {
      const tokens = await this.issueTokens(user.id, user.email);
      return {
        ok: true,
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
        },
      };
    }

    const token = await this.prisma.emailToken.findFirst({
      where: {
        userId: user.id,
        type: 'VERIFY_EMAIL',
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
        data: { emailVerifiedAt: now() },
      }),
      this.prisma.emailToken.update({
        where: { id: token.id },
        data: { consumedAt: now() },
      }),
    ]);

    const fresh = await this.prisma.user.findUnique({ where: { id: user.id } });
    const tokens = await this.issueTokens(fresh!.id, fresh!.email);

    return {
      ok: true,
      ...tokens,
      user: {
        id: fresh!.id,
        email: fresh!.email,
        emailVerifiedAt: fresh!.emailVerifiedAt,
      },
    };
  }

  // =========================================================
  // FORGOT / RESET PASSWORD – cez 6-ciferný KÓD (bez linku)
  // =========================================================

  /**
   * Pošle 6-ciferný kód pre reset hesla (platnosť 15 min).
   * Cooldown 60s, zmaže staré nevyužité kódy.
   */
  async forgotPassword(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // neprezrádzaj, že neexistuje

    // Cooldown: 60 sekúnd
    const recent = await this.prisma.emailToken.findFirst({
      where: { userId: user.id, type: 'RESET_PASSWORD' },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < 60_000) return;

    // Odstráň staré nevyužité reset kódy
    await this.prisma.emailToken.deleteMany({
      where: { userId: user.id, type: 'RESET_PASSWORD', consumedAt: null },
    });

    const code = gen6();
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        type: 'RESET_PASSWORD',
        tokenHash: codeHash, // držíme aj tokenHash pre konzistenciu
        codeHash,
        sentTo: email,
        expiresAt,
      },
    });

    await this.email.send(
      email,
      'Reset hesla – tvoj kód',
      resetPasswordCodeEmail(code),
    );

    return { ok: true };
  }

  /**
   * Overí 6-ciferný kód a nastaví nové heslo.
   */
  async resetPassword(emailRaw: string, codeRaw: string, newPassword: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Neplatný kód alebo e-mail');

    const token = await this.prisma.emailToken.findFirst({
      where: {
        userId: user.id,
        type: 'RESET_PASSWORD',
        codeHash: sha256(codeRaw), // OVERUJEME KÓD (nie link)
        consumedAt: null,
        expiresAt: { gt: now() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) throw new BadRequestException('Neplatný alebo expirovaný kód');

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

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      ok: true,
      ...tokens,
      user: { id: user.id, email: user.email },
    };
  }

  // =========================================================
  // OTP LOGIN (jednorazový 6-ciferný kód)
  // =========================================================

  /**
   * Vygeneruje a odošle 6-ciferný kód (platí 10 min).
   * Rate-limit: ak bol naposledy poslaný pred < 60s, mlčky skončí.
   * POZN: Ak chceš login iba registrovaným, nahraď vytváranie usera validáciou.
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
      user = await this.prisma.user.create({
        data: { email, name: 'unknown' },
      });
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
   * Overí 6-ciferný kód, consume-ne ho, označí email ako overený
   * a vráti priamo ACCESS + REFRESH tokeny (auto-login).
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

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      ok: true,
      ...tokens,
      user: { id: user.id, email: user.email },
    };
  }
  ///login
  async loginWithPassword(emailRaw: string, password: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // jednotná chyba – neodhaľňuj, čo zlyhalo
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // (voliteľné) vyžaduj verifikovaný e-mail
    // if (!user.emailVerifiedAt) throw new UnauthorizedException('Email not verified');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      ok: true as const,
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  }
}
