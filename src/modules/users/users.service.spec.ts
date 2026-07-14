import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { S3Service } from '../../shared/services/s3.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    technician: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockRedisService = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    delByPrefix: jest.fn(),
  };

  const mockS3Service = {
    getFileUrl: jest.fn((key) => `https://s3-url.com/${key}`),
    makeObjectPublic: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      full_name: 'Test Engineer',
      email: 'test@example.com',
      password: 'password123',
      phone_number: '+919999999999',
      role_id: 'role-id',
      account_status: 'ACTIVE',
    };

    it('should create a new user if email and phone do not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.technician.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockCreatedUser = {
        id: 'new-user-id',
        ...createUserDto,
        password_hash: 'hashedPassword',
        deleted_at: null,
        role: { name: 'Admin' },
      };
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe('new-user-id');
    });

    it('should throw ConflictException if an active user with same email exists', async () => {
      const activeUser = {
        id: 'existing-id',
        email: 'test@example.com',
        deleted_at: null,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(activeUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should restore and reactivate the user if a soft-deleted user with same email exists', async () => {
      const softDeletedUser = {
        id: 'deleted-id',
        email: 'test@example.com',
        deleted_at: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(softDeletedUser);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.technician.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const restoredUser = {
        id: 'deleted-id',
        ...createUserDto,
        password_hash: 'hashedPassword',
        deleted_at: null,
        role: { name: 'Admin' },
      };
      mockPrismaService.user.update.mockResolvedValue(restoredUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'deleted-id' },
        data: expect.objectContaining({
          deleted_at: null,
        }),
        include: { role: true },
      });
      expect(result.id).toBe('deleted-id');
    });
  });

  describe('remove', () => {
    it('should soft-delete user and rename email/phone to release unique constraints', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        phone_number: '+919999999999',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deleted_at: new Date(),
        account_status: 'DELETED',
      });

      const result = await service.remove('user-id');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          account_status: 'DELETED',
          email: expect.stringContaining('test@example.com_deleted_'),
          phone_number: expect.stringContaining('+919999999999_deleted_'),
        }),
      });
      expect(prisma.technician.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-id', deleted_at: null },
        data: expect.objectContaining({
          status: 'INACTIVE',
          email: expect.stringContaining('test@example.com_deleted_'),
          phone: expect.stringContaining('+919999999999_deleted_'),
        }),
      });
      expect(result).toBeDefined();
    });
  });
});
