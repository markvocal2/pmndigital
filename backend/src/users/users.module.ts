import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminGuard } from '../cms/admin.guard';
import { AuditModule } from '../audit/audit.module';
import { ErpModule } from '../erp/erp.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule, ErpModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService, AdminGuard],
  exports: [UsersService],
})
export class UsersModule {}
