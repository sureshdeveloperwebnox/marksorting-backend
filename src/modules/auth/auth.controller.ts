import { Controller, Post, UseGuards, Request, Body, Get, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as express from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setTokens(res: express.Response, result: any) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Changed to lax for better dev experience with redirects
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req: any, @Res({ passthrough: true }) res: express.Response) {
    const result = await this.authService.login(req.user);
    this.setTokens(res, result);
    return { user: result.user };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: express.Response) {
    const result = await this.authService.register(registerDto);
    this.setTokens(res, result);
    return { user: result.user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: express.Response) {
    // Try to get user ID from token even if expired for Redis cleanup
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = this.authService.decodeToken(token);
        if (payload?.sub) {
          await this.authService.logout(payload.sub);
        }
      }
    } catch (e) {
      // Ignore Redis errors during logout
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Request() req: any, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const result = await this.authService.refresh(refreshToken);
    this.setTokens(res, result);
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
