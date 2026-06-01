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
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { MobileLoginResponseDto } from './dto/mobile-login-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { Public } from '../../common/decorators/public.decorator';
import * as express from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private setTokens(
    req: express.Request,
    res: express.Response,
    result: any,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    // Detect ngrok tunnels or cross-site contexts for sameSite: 'none'
    const host = (req.headers.host || '').toLowerCase();
    const origin = (req.headers.origin || '').toLowerCase();
    const isNgrok = host.includes('ngrok') || origin.includes('ngrok');
    
    const cookieSecure = isProduction || isSecure;
    const cookieSameSite = isNgrok ? 'none' : 'lax';

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    const roleName = result.user.role?.name || result.user.role || 'Unknown Role';
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
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = this.authService.decodeToken(token);
        if (payload?.sub) {
          userId = payload.sub;
          userEmail = payload.email || 'Unknown';
          await this.authService.logout(payload.sub);
        }
      }
    } catch (e) {
      // Ignore Redis errors during logout
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

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
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
    return { message: 'If the email exists, a password reset link has been sent' };
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
}
