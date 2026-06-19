import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { parseDuration } from '../../common/utils/date-time';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private permissionsService: PermissionsService,
    private prisma: PrismaService,
    private mailService: MailService,
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
    
    const roleName = user?.role?.name || (typeof user?.role === 'string' ? user.role : undefined);
    const isServiceEngineer = roleName?.toLowerCase() === 'service engineer' || roleName?.toLowerCase() === 'service_engineer';
    const isActive = user?.account_status?.toUpperCase() === 'ACTIVE';

    if (
      user &&
      isServiceEngineer &&
      isActive &&
      !user.deleted_at &&
      (await bcrypt.compare(pass, user.password_hash))
    ) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: any) {
    // Find default role (Super Admin)
    const roles = await this.usersService.getRoles();
    const defaultRole =
      roles.find((r: any) => r.name === 'Super Admin') || roles[0];

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
    // Get user permissions
    const permissions = await this.permissionsService.getUserPermissions(
      user.id,
    );

    const payload = {
      email: user.email,
      sub: user.id,
      full_name: user.full_name,
      role: user.role.name,
      permissions: permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generateRefreshToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role.name,
        permissions: permissions,
        phone_number: user.phone_number,
        mobile_no: user.phone_number,
        profile_image: user.profile_image,
        profile_image_url: user.profile_image_url,
        background_image: user.background_image,
        background_image_url: user.background_image_url,
      },
    };
  }

  async mobileLogin(user: any) {
    // Get user permissions
    const permissions = await this.permissionsService.getUserPermissions(
      user.id,
    );

    const payload = {
      email: user.email,
      sub: user.id,
      full_name: user.full_name,
      role: user.role.name,
      permissions: permissions,
    };

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
    const permissions =
      await this.permissionsService.getUserPermissions(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role?.name ?? user.role,
      permissions,
      phone_number: user.phone_number,
      mobile_no: user.phone_number,
      profile_image: user.profile_image,
      profile_image_url: user.profile_image_url,
      background_image: user.background_image,
      background_image_url: user.background_image_url,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await this.redisService.del(`refresh_token:${userId}:${hash}`);
    } else {
      await this.redisService.delByPrefix(`refresh_token:${userId}:`);
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { after: user } = await this.usersService.update(userId, dto);
    const permissions =
      await this.permissionsService.getUserPermissions(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role?.name ?? user.role,
      permissions,
      phone_number: user.phone_number,
      mobile_no: user.phone_number,
      profile_image: user.profile_image,
      profile_image_url: user.profile_image_url,
      background_image: user.background_image,
      background_image_url: user.background_image_url,
    };
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
        expiresIn: refreshExpiresIn as any,
      },
    );

    // Parse duration to seconds for Redis TTL (default 7 days)
    const redisExpirySeconds = Math.floor(
      parseDuration(refreshExpiresIn, 7 * 24 * 60 * 60 * 1000) / 1000,
    );

    const hash = this.hashToken(refreshToken);

    // Store in Redis with expiry
    await this.redisService.set(
      `refresh_token:${userId}:${hash}`,
      'active',
      'EX',
      redisExpirySeconds,
    );

    return refreshToken;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const userId = payload.sub;
      const hash = this.hashToken(refreshToken);
      const tokenKey = `refresh_token:${userId}:${hash}`;
      const storedValue = await this.redisService.get(tokenKey);

      if (!storedValue) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Handle reuse grace period (rotated within 60s)
      if (storedValue.startsWith('{')) {
        const parsed = JSON.parse(storedValue);
        if (parsed.status === 'rotated') {
          const now = Date.now();
          if (now - parsed.rotatedAt < 60000) {
            const nextKey = `refresh_token:${userId}:${parsed.newHash}`;
            const nextValue = await this.redisService.get(nextKey);
            if (nextValue) {
              return {
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
                user: await this.getProfile(userId),
              };
            }
          } else {
            // Potential token reuse breach! Revoke all tokens for safety
            await this.redisService.delByPrefix(`refresh_token:${userId}:`);
            throw new UnauthorizedException('Refresh token expired and reused. Sessions revoked.');
          }
        }
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (storedValue !== 'active') {
        throw new UnauthorizedException('Invalid refresh token state');
      }

      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get fresh permissions
      const permissions =
        await this.permissionsService.getUserPermissions(userId);

      // Generate new access token payload
      const newPayload = {
        email: user.email,
        sub: user.id,
        full_name: user.full_name,
        role: user.role.name,
        permissions: permissions,
      };
      const newAccessToken = this.jwtService.sign(newPayload);

      // Generate new refresh token for rotation
      const newRefreshToken = await this.generateRefreshToken(userId);
      const newHash = this.hashToken(newRefreshToken);

      // Mark current token as rotated with 60s TTL
      const rotatedData = JSON.stringify({
        status: 'rotated',
        newHash,
        rotatedAt: Date.now(),
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });

      // Keep rotated token valid for 60 seconds to support concurrent reloads
      await this.redisService.set(tokenKey, rotatedData, 'EX', 60);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role.name,
          permissions: permissions,
          phone_number: user.phone_number,
          mobile_no: user.phone_number,
          profile_image: user.profile_image,
          profile_image_url: user.profile_image_url,
          background_image: user.background_image,
          background_image_url: user.background_image_url,
        },
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email address not found');
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    // Store hashed version of the token in database for security
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Set token expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save to password_resets table
    await this.prisma.passwordReset.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // Queue email sending asynchronously
    await this.mailService.sendPasswordResetMail(
      user.email,
      user.full_name,
      token,
    );
  }

  async resetPassword(token: string, newPass: string): Promise<void> {
    // Hash the incoming token to match what's stored in the database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find the latest active password reset record for this token hash
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPass, 10);

    // Update user's password and invalidate cache
    await this.prisma.$transaction([
      // Update user password
      this.prisma.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash: hashedPassword },
      }),
      // Mark token as used
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used_at: new Date() },
      }),
    ]);

    // Invalidate user cache to ensure clean updates (must match UsersService cache keys)
    await this.redisService.delByPrefix(`refresh_token:${resetRecord.user_id}:`);
    await this.redisService.del(`user:email:${resetRecord.user.email}`);
    await this.redisService.del(`user:id:${resetRecord.user_id}`);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user with role information
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify user is a Service Engineer
    if (user.role?.name !== 'Service Engineer') {
      throw new UnauthorizedException(
        'Only service engineers can change password via this endpoint',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate sessions in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password_hash: hashedPassword },
      }),
    ]);

    // Invalidate all refresh tokens for this user (force re-login)
    await this.redisService.delByPrefix(`refresh_token:${userId}:`);

    // Invalidate user cache (must match UsersService cache keys)
    await this.redisService.del(`user:email:${user.email}`);
    await this.redisService.del(`user:id:${userId}`);
    await this.permissionsService.invalidateUserPermissionsCache(userId);
  }
}
