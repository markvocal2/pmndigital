/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthService, TwoFactorRequiredException } from './auth.service';
import { User } from '../users/user.entity';
import { TwoFAService } from './twofa.service';
import { AuditService } from '../audit/audit.service';

const compare = (plain: string, hash: string) => bcrypt.compare(plain, hash);
const hashFast = (plain: string) => bcrypt.hash(plain, 4);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'a@b.c',
    passwordHash: '',
    firstName: null,
    lastName: null,
    displayName: null,
    name: null,
    avatarUrl: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    erpCustomerId: null,
    erpSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<User>>;
  let twofa: jest.Mocked<TwoFAService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const twofaMock: Partial<jest.Mocked<TwoFAService>> = {
      verifyChallenge: jest.fn(),
    };
    const auditMock: Partial<jest.Mocked<AuditService>> = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: TwoFAService, useValue: twofaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(getRepositoryToken(User));
    twofa = module.get(TwoFAService);
  });

  describe('validateUser', () => {
    it('throws Unauthorized when user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.validateUser({ email: 'a@b.c', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Unauthorized on bad password', async () => {
      repo.findOne.mockResolvedValue(
        makeUser({ passwordHash: await hashFast('correct-pass') }),
      );
      await expect(
        service.validateUser({ email: 'a@b.c', password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns SafeUser (no passwordHash) on valid creds without 2FA', async () => {
      const hash = await hashFast('correct-pass');
      const dt = new Date('2026-01-01');
      repo.findOne.mockResolvedValue(
        makeUser({
          name: 'Alice',
          passwordHash: hash,
          createdAt: dt,
          updatedAt: dt,
        }),
      );
      const result = await service.validateUser({
        email: 'a@b.c',
        password: 'correct-pass',
      });
      expect(result.id).toBe(1);
      expect(result.email).toBe('a@b.c');
      expect(result.name).toBe('Alice');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(
        (result as Record<string, unknown>).twoFactorSecret,
      ).toBeUndefined();
    });

    it('throws TwoFactorRequiredException when 2FA enabled but no code', async () => {
      const hash = await hashFast('correct-pass');
      repo.findOne.mockResolvedValue(
        makeUser({ passwordHash: hash, twoFactorEnabled: true }),
      );
      await expect(
        service.validateUser({ email: 'a@b.c', password: 'correct-pass' }),
      ).rejects.toBeInstanceOf(TwoFactorRequiredException);
    });

    it('verifies 2FA code when provided and proceeds', async () => {
      const hash = await hashFast('correct-pass');
      repo.findOne.mockResolvedValue(
        makeUser({ passwordHash: hash, twoFactorEnabled: true }),
      );
      twofa.verifyChallenge.mockResolvedValue(true);
      const result = await service.validateUser({
        email: 'a@b.c',
        password: 'correct-pass',
        twoFactorCode: '123456',
      });
      expect(result.id).toBe(1);
      expect(twofa.verifyChallenge).toHaveBeenCalledTimes(1);
    });

    it('rejects bad 2FA code', async () => {
      const hash = await hashFast('correct-pass');
      repo.findOne.mockResolvedValue(
        makeUser({ passwordHash: hash, twoFactorEnabled: true }),
      );
      twofa.verifyChallenge.mockResolvedValue(false);
      await expect(
        service.validateUser({
          email: 'a@b.c',
          password: 'correct-pass',
          twoFactorCode: 'wrong0',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('throws Conflict when email already exists', async () => {
      repo.findOne.mockResolvedValue(makeUser());
      await expect(
        service.register({ email: 'a@b.c', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password before saving', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => makeUser(dto as Partial<User>));
      repo.save.mockImplementation((u) =>
        Promise.resolve(
          makeUser({
            ...(u as Partial<User>),
            id: 42,
          }),
        ),
      );

      const result = await service.register({
        email: 'new@user.com',
        password: 'a-strong-pass',
        name: 'New',
      });

      expect(repo.create).toHaveBeenCalledTimes(1);

      const createCall = repo.create.mock.calls[0][0] as Partial<User>;
      expect(createCall.email).toBe('new@user.com');
      expect(createCall.name).toBe('New');
      expect(createCall.passwordHash).toBeDefined();
      expect(createCall.passwordHash).not.toBe('a-strong-pass');
      const matches = await compare('a-strong-pass', createCall.passwordHash!);
      expect(matches).toBe(true);
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(result.id).toBe(42);
    });
  });
});
