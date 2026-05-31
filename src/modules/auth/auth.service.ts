import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
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
    // Find default role (Super Admin)
    const roles = await this.usersService.getRoles();
    const defaultRole = roles.find((r: any) => r.name === 'Super Admin') || roles[0];

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
    const permissions = await this.permissionsService.getUserPermissions(user.id);
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      full_name: user.full_name,
      role: user.role.name,
      permissions: permissions
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
        profile_image: user.profile_image,
        profile_image_url: user.profile_image_url,
        background_image: user.background_image,
        background_image_url: user.background_image_url,
      },
    };
  }

  async mobileLogin(user: any) {
    // Get user permissions
    const permissions = await this.permissionsService.getUserPermissions(user.id);
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      full_name: user.full_name,
      role: user.role.name,
      permissions: permissions
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
    const permissions = await this.permissionsService.getUserPermissions(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role?.name ?? user.role,
      permissions,
      profile_image: user.profile_image,
      profile_image_url: user.profile_image_url,
      background_image: user.background_image,
      background_image_url: user.background_image_url,
    };
  }

  async logout(userId: string) {
    await this.redisService.del(`refresh_token:${userId}`);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { after: user } = await this.usersService.update(userId, dto);
    const permissions = await this.permissionsService.getUserPermissions(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role?.name ?? user.role,
      permissions,
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

      // Get fresh permissions
      const permissions = await this.permissionsService.getUserPermissions(userId);

      const newPayload = {
        email: user.email,
        sub: user.id,
        full_name: user.full_name,
        role: user.role.name,
        permissions: permissions,
      };
      return {
        access_token: this.jwtService.sign(newPayload),
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role.name,
          permissions: permissions,
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
    await this.mailService.sendPasswordResetMail(user.email, user.full_name, token);
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

    // Invalidate user cache to ensure clean updates
    await this.redisService.del(`refresh_token:${resetRecord.user_id}`);
    await this.redisService.del(`users:email:${resetRecord.user.email}`);
    await this.redisService.del(`users:id:${resetRecord.user_id}`);
  }
}
