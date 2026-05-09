/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

const compare = (plain: string, hash: string) => bcrypt.compare(plain, hash);
const hashFast = (plain: string) => bcrypt.hash(plain, 4);

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('validateUser', () => {
    it('throws Unauthorized when user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.validateUser({ email: 'a@b.c', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Unauthorized on bad password', async () => {
      repo.findOne.mockResolvedValue({
        id: 1,
        email: 'a@b.c',
        name: null,
        passwordHash: await hashFast('correct-pass'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(
        service.validateUser({ email: 'a@b.c', password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns SafeUser (no passwordHash) on valid creds', async () => {
      const hash = await hashFast('correct-pass');
      repo.findOne.mockResolvedValue({
        id: 1,
        email: 'a@b.c',
        name: 'Alice',
        passwordHash: hash,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      const result = await service.validateUser({
        email: 'a@b.c',
        password: 'correct-pass',
      });
      expect(result).toEqual({
        id: 1,
        email: 'a@b.c',
        name: 'Alice',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });

  describe('register', () => {
    it('throws Conflict when email already exists', async () => {
      repo.findOne.mockResolvedValue({ id: 1 } as User);
      await expect(
        service.register({ email: 'a@b.c', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password before saving', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => dto as User);
      repo.save.mockImplementation((u) =>
        Promise.resolve({
          ...(u as User),
          id: 42,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
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
