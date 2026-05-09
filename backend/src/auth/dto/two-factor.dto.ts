import { IsOptional, IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 10)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 10)
  code?: string;
}
