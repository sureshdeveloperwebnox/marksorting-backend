import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async validateServiceEngineer(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.role?.name === 'Service Engineer' &&
      user.account_status === 'ACTIVE' &&
      !user.deleted_at &&
      (await bcrypt.compare(pass, user.password_hash))
    ) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: any) {
    // Find default role (USER or any existing role)
    const roles = await this.usersService.getRoles();
    const defaultRole = roles.find((r: any) => r.name === 'USER') || roles[0];

    if (!defaultRole) {
      throw new UnauthorizedException('No default roles defined in the system');
    }

    const user = await this.usersService.create({
      full_name: registerDto.full_name,
      email: registerDto.email,
      password: registerDto.password,
      role_id: defaultRole.id,
      account_status: 'ACTIVE',
    });

    return this.login(user);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generateRefreshToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role.name,
        profile_image: user.profile_image,
        profile_image_url: user.profile_image_url,
        background_image: user.background_image,
        background_image_url: user.background_image_url,
      },
    };
  }

  async mobileLogin(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generateRefreshToken(user.id),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async logout(userId: string) {
    await this.redisService.del(`refresh_token:${userId}`);
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiresIn',
        ) as any,
      },
    );

    // Store in Redis with expiry
    await this.redisService.set(
      `refresh_token:${userId}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60, // 7 days
    );

    return refreshToken;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const userId = payload.sub;
      const storedToken = await this.redisService.get(
        `refresh_token:${userId}`,
      );

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        email: user.email,
        sub: user.id,
        role: user.role.name,
      };
      return {
        access_token: this.jwtService.sign(newPayload),
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role.name,
          profile_image: user.profile_image,
          profile_image_url: user.profile_image_url,
          background_image: user.background_image,
          background_image_url: user.background_image_url,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
