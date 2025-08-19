import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('password/forgot')
  @HttpCode(200) // neprezrádzame, či e-mail existuje
  async forgot(@Body() dto: ForgotDto) {
    await this.auth.forgotPassword(dto.email);
    return { ok: true };
  }

  @Post('password/reset')
  async reset(@Body() dto: ResetDto) {
    await this.auth.resetPassword(dto.email, dto.token, dto.newPassword);
    return { ok: true };
  }

  // === OTP login ===
  @Post('otp/request')
  @HttpCode(200)
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.auth.requestOtp(dto.email);
    return { ok: true };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.email, dto.code);
  }
}
