import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Put,
  Res,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { MobileLoginResponseDto } from './dto/mobile-login-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto/change-password.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { Public } from '../../common/decorators/public.decorator';
import { parseDuration } from '../../common/utils/date-time';
import * as express from 'express';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private activityLogsService: ActivityLogsService,
    private configService: ConfigService,
  ) {}

  /** Returns cookie security flags based on the actual transport (HTTPS vs HTTP). */
  private getCookieFlags(req: express.Request): { secure: boolean; sameSite: 'none' | 'lax' } {
    // Use actual connection security, NOT NODE_ENV, to determine flags.
    // This ensures cookies work correctly both in local HTTP dev and production HTTPS.
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    return {
      secure: isSecure,
      // sameSite 'none' requires secure:true per browser spec.
      // Fall back to 'lax' for plain HTTP (local dev) so cookies are accepted.
      sameSite: isSecure ? 'none' : 'lax',
    };
  }

  private setTokens(req: express.Request, res: express.Response, result: any) {
    const { secure: cookieSecure, sameSite: cookieSameSite } = this.getCookieFlags(req);

    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    const jwtRefreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const accessTokenMaxAge = parseDuration(jwtExpiresIn, 15 * 60 * 1000);
    const refreshTokenMaxAge = parseDuration(jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    const now = Date.now();
    res.cookie('access_token_expires', (now + accessTokenMaxAge).toString(), {
      httpOnly: false,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: refreshTokenMaxAge,
        path: '/',
      });
      res.cookie('refresh_token_expires', (now + refreshTokenMaxAge).toString(), {
        httpOnly: false,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: refreshTokenMaxAge,
        path: '/',
      });
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(
    @Request() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(req.user);
    this.setTokens(req, res, result);

    // Log successful login
    const userAgent = req.headers['user-agent'] as string | undefined;
    const deviceName = this.getDeviceName(userAgent);
    const roleName =
      result.user.role?.name || result.user.role || 'Unknown Role';
    await this.activityLogsService.create({
      user_id: result.user.id,
      action: ActivityAction.LOGIN,
      description: `"${result.user.full_name}" (${result.user.email}) logged in — Role: ${roleName} | Device: ${deviceName || 'Unknown'} | IP: ${req.ip || 'N/A'}`,
      metadata: {
        role: result.user.role,
        ip_address: req.ip,
        device: deviceName,
      },
      ip_address: req.ip,
      user_agent: userAgent,
      device_name: deviceName,
    });

    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  private getDeviceName(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({ type: RegisterDto })
  async register(
    @Request() req: any,
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setTokens(req, res, result);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    let userId: string | null = null;
    let userEmail = 'Unknown';

    // Try to get user ID from token even if expired for Redis cleanup
    try {
      let refreshToken = req.cookies?.['refresh_token'];
      if (!refreshToken && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
          refreshToken = parts[1];
        }
      }

      const authHeader = req.headers.authorization;
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies?.['access_token']) {
        token = req.cookies?.['access_token'];
      }

      if (token) {
        const payload = this.authService.decodeToken(token);
        if (payload?.sub) {
          userId = payload.sub;
          userEmail = payload.email || 'Unknown';
          await this.authService.logout(payload.sub, refreshToken);
        }
      } else if (refreshToken) {
        const payload = this.authService.decodeToken(refreshToken);
        if (payload?.sub) {
          userId = payload.sub;
          await this.authService.logout(payload.sub, refreshToken);
        }
      }
    } catch (e) {
      // Ignore errors during logout
    }

    // Log logout if we have a user ID
    if (userId) {
      const userAgent = req.headers['user-agent'] as string | undefined;
      const deviceName = this.getDeviceName(userAgent);
      await this.activityLogsService.create({
        user_id: userId,
        action: ActivityAction.LOGOUT,
        description: `"${userEmail}" logged out — Device: ${deviceName || 'Unknown'} | IP: ${req.ip || 'N/A'} | Session ended`,
        ip_address: req.ip,
        user_agent: userAgent,
        device_name: deviceName,
      });
    }

    // Must include the same secure/sameSite flags used when setting, or browsers ignore the clear.
    const { secure: cookieSecure, sameSite: cookieSameSite } = this.getCookieFlags(req);
    res.clearCookie('access_token', { path: '/', secure: cookieSecure, sameSite: cookieSameSite });
    res.clearCookie('refresh_token', { path: '/', secure: cookieSecure, sameSite: cookieSameSite });
    res.clearCookie('access_token_expires', { path: '/', secure: cookieSecure, sameSite: cookieSameSite });
    res.clearCookie('refresh_token_expires', { path: '/', secure: cookieSecure, sameSite: cookieSameSite });
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Request() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    let refreshToken = req.cookies?.['refresh_token'];

    // Check Authorization header for Bearer token if not in cookies (for mobile clients)
    if (!refreshToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        refreshToken = parts[1];
      }
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const result = await this.authService.refresh(refreshToken);
    this.setTokens(req, res, result);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @Public()
  @Post('mobile/login')
  @ApiOperation({ summary: 'Login for service engineers (mobile clients)' })
  @ApiBody({ type: MobileLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    type: MobileLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or not a service engineer',
  })
  async mobileLogin(@Body() mobileLoginDto: MobileLoginDto) {
    const user = await this.authService.validateServiceEngineer(
      mobileLoginDto.email,
      mobileLoginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Invalid email/password or user is not a service engineer',
      );
    }
    return this.authService.mobileLogin(user);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset email queued successfully' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Service Engineer')
  @Post('mobile/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password for service engineers (mobile app)',
    description:
      'Allows authenticated service engineers to change their password. Requires current password verification. All existing sessions will be invalidated after password change.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully. User must login again.',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Invalid current password or user is not a service engineer',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - New password validation failed or same as current password',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    await this.authService.changePassword(
      req.user.userId,
      changePasswordDto.current_password,
      changePasswordDto.new_password,
    );

    // Log the password change activity
    await this.activityLogsService.create({
      user_id: req.user.userId,
      action: ActivityAction.UPDATE,
      description: `Service engineer "${req.user.full_name || req.user.email}" changed their password`,
      metadata: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string,
    });

    return {
      message:
        'Password changed successfully. Please login again with your new password.',
    };
  }
}
