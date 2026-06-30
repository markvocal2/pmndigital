import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveIntegrationDto {
  @IsOptional() @IsIn(['API_KEY', 'OAUTH']) mode?: string;
  @IsOptional() @IsString() @MaxLength(800) apiKey?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}
