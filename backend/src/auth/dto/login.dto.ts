import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  /** Optional TOTP code (or backup code) when the account has 2FA enabled. */
  @IsOptional()
  @IsString()
  @Length(6, 10)
  twoFactorCode?: string;
}
