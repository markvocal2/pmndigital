import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;
}
