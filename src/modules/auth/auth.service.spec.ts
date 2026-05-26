import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let redisService: RedisService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return null;
    }),
  };

  const mockRedisService = {
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateServiceEngineer', () => {
    it('should return user without password_hash if validation succeeds', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'engineer@marksorting.com',
        password_hash: 'hashedPassword',
        role: { name: 'Service Engineer' },
        account_status: 'ACTIVE',
        deleted_at: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateServiceEngineer(
        'engineer@marksorting.com',
        'password123',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'engineer@marksorting.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual({
        id: 'user-id',
        email: 'engineer@marksorting.com',
        role: { name: 'Service Engineer' },
        account_status: 'ACTIVE',
        deleted_at: null,
      });
    });

    it('should return null if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateServiceEngineer(
        'nonexistent@marksorting.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if user does not have Service Engineer role', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@marksorting.com',
        password_hash: 'hashedPassword',
        role: { name: 'USER' },
        account_status: 'ACTIVE',
        deleted_at: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateServiceEngineer(
        'user@marksorting.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if user is not ACTIVE', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'engineer@marksorting.com',
        password_hash: 'hashedPassword',
        role: { name: 'Service Engineer' },
        account_status: 'INACTIVE',
        deleted_at: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateServiceEngineer(
        'engineer@marksorting.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'engineer@marksorting.com',
        password_hash: 'hashedPassword',
        role: { name: 'Service Engineer' },
        account_status: 'ACTIVE',
        deleted_at: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateServiceEngineer(
        'engineer@marksorting.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('mobileLogin', () => {
    it('should generate and return access_token and refresh_token', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'engineer@marksorting.com',
        role: { name: 'Service Engineer' },
      };

      mockJwtService.sign.mockImplementation((payload) => {
        if (payload.sub && !payload.email) return 'refresh-token-val';
        return 'access-token-val';
      });

      const result = await service.mobileLogin(mockUser);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        'refresh_token:user-id',
        'refresh-token-val',
        'EX',
        expect.any(Number),
      );
      expect(result).toEqual({
        access_token: 'access-token-val',
        refresh_token: 'refresh-token-val',
      });
    });
  });
});
