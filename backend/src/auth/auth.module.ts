import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFAController } from './twofa.controller';
import { TwoFAService } from './twofa.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule],
  controllers: [AuthController, TwoFAController],
  providers: [AuthService, TwoFAService],
  exports: [AuthService, TwoFAService],
})
export class AuthModule {}
