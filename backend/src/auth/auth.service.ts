import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async validateUser(dto: LoginDto): Promise<SafeUser> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
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

  private static strip(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
