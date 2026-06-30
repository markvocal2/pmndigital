import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateAutomationDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
}
