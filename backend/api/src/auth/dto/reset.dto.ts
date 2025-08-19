import { IsEmail, IsString, MinLength } from 'class-validator';
export class ResetDto {
  @IsEmail() email!: string;
  @IsString() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
