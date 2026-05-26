import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateServiceEngineer: jest.fn(),
    mobileLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('mobileLogin', () => {
    it('should return access_token and refresh_token for a valid service engineer', async () => {
      const loginDto = {
        email: 'engineer@marksorting.com',
        password: 'password123',
      };
      const mockUser = {
        id: 'user-id',
        email: 'engineer@marksorting.com',
        role: { name: 'Service Engineer' },
      };
      const mockTokens = {
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
      };

      mockAuthService.validateServiceEngineer.mockResolvedValue(mockUser);
      mockAuthService.mobileLogin.mockResolvedValue(mockTokens);

      const result = await controller.mobileLogin(loginDto);

      expect(authService.validateServiceEngineer).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.mobileLogin).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if credentials are invalid or not service engineer', async () => {
      const loginDto = {
        email: 'wrong@marksorting.com',
        password: 'password123',
      };

      mockAuthService.validateServiceEngineer.mockResolvedValue(null);

      await expect(controller.mobileLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateServiceEngineer).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });
});
