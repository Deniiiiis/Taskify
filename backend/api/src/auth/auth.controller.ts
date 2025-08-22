import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
class RefreshDto {
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // --- Registrácia ---
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Service už vracia { ok: true, user }, netreba to znova baliť
    return this.auth.register(dto);
  }

  // --- Reset hesla ---
  @Post('password/forgot')
  @HttpCode(200) // neprezrádzame, či e-mail existuje
  async forgot(@Body() dto: ForgotDto) {
    await this.auth.forgotPassword(dto.email);
    return { ok: true };
  }

  @Post('password/reset')
  @HttpCode(200)
  async reset(@Body() dto: ResetDto) {
    const result = await this.auth.resetPassword(
      dto.email,
      dto.token,
      dto.newPassword,
    );
    return result;
  }

  // --- OTP login ---
  @Post('otp/request')
  @HttpCode(200)
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.auth.requestOtp(dto.email);
    return { ok: true };
  }

  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    // AuthService.verifyOtp už vracia: { ok, user, accessToken, refreshToken }
    return this.auth.verifyOtp(dto.email, dto.code);
  }

  // --- Verifikácia e-mailu kódom ---
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    // Service vracia { ok, user, accessToken, refreshToken }
    return this.auth.verifyEmail(dto.email, dto.code);
  }

  // --- Refresh tokenu ---
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    const decoded = await this.auth.verifyRefresh(dto.refreshToken);
    const tokens = await this.auth.issueTokens(decoded.sub, decoded.email);
    return { ok: true, ...tokens };
  }
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.auth.loginWithPassword(dto.email, dto.password);
  }
}
