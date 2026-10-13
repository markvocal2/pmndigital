import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ErpModule } from './erp/erp.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { CmsModule } from './cms/cms.module';
import { MailModule } from './mail/mail.module';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
      // node-postgres pool: every wait has an end. Without these a dead socket or an unresolvable
      // host leaves requests queued forever (13 Oct 2026: the whole site hung for hours).
      extra: {
        max: 20,
        connectionTimeoutMillis: 5_000, // give up on connecting (incl. DNS) after 5 s
        idleTimeoutMillis: 30_000,
        keepAlive: true, // notice half-open sockets instead of writing into the void
        statement_timeout: 15_000, // server side: no public query runs longer than 15 s
        query_timeout: 20_000, // client side: stop waiting even if the server never answers
      },
    }),
    MailModule,
    AuditModule,
    ErpModule,
    AuthModule,
    UsersModule,
    PaymentsModule,
    CmsModule,
    AiModule,
    McpModule,
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
