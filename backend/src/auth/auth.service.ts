import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TwoFAService } from './twofa.service';
import { AuditService } from '../audit/audit.service';

export type SafeUser = Omit<
  User,
  'passwordHash' | 'twoFactorSecret' | 'twoFactorBackupCodes'
>;

export class TwoFactorRequiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'TwoFactorRequired',
        message: 'Two-factor authentication code required',
        code: 'TWO_FACTOR_REQUIRED',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly twofa: TwoFAService,
    private readonly audit: AuditService,
  ) {}

  async validateUser(
    dto: LoginDto,
    audit: { ip?: string; userAgent?: string } = {},
  ): Promise<SafeUser> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      await this.audit.log('login_failed', {
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: { reason: 'user_not_found', email: dto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.audit.log('login_failed', {
        userId: user.id,
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: { reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        await this.audit.log('login_2fa_required', {
          userId: user.id,
          ip: audit.ip,
          userAgent: audit.userAgent,
        });
        throw new TwoFactorRequiredException();
      }
      const codeOk = await this.twofa.verifyChallenge(user, dto.twoFactorCode);
      if (!codeOk) {
        await this.audit.log('login_2fa_failed', {
          userId: user.id,
          ip: audit.ip,
          userAgent: audit.userAgent,
        });
        throw new UnauthorizedException('Invalid two-factor code');
      }
      await this.audit.log('login_2fa_succeeded', {
        userId: user.id,
        ip: audit.ip,
        userAgent: audit.userAgent,
      });
    }
    await this.audit.log('login_success', {
      userId: user.id,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
    return AuthService.strip(user);
  }

  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthService.BCRYPT_ROUNDS,
    );
    const created = this.users.create({
      email: dto.email,
      name: dto.name ?? null,
      passwordHash,
    });
    const saved = await this.users.save(created);
    return AuthService.strip(saved);
  }

  static strip(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      name: user.name,
      avatarUrl: user.avatarUrl,
      twoFactorEnabled: user.twoFactorEnabled,
      erpCustomerId: user.erpCustomerId,
      erpSyncedAt: user.erpSyncedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
