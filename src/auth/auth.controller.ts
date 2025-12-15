import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Microsoft OAuth' })
  async microsoftAuth(@Res() res: Response) {
    // Check if Microsoft OAuth is configured
    const clientID = this.configService.get('MICROSOFT_CLIENT_ID');
    if (!clientID) {
      return res.status(500).json({
        error: 'Microsoft OAuth is not configured',
        message: 'Please set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_CALLBACK_URL environment variables',
      });
    }
    // This endpoint initiates the OAuth flow
    // Passport will automatically redirect to Microsoft
    // This method should not be reached, but is required for the route
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth login successful' })
  async microsoftAuthCallback(@Req() req: any, @Res() res: Response) {
    // User is attached to request by passport strategy
    const user = req.user;
    const tokens = await this.authService.loginWithMicrosoft(user);
    
    // Redirect to frontend callback with tokens
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const redirectUrl = new URL(`${frontendUrl}/auth/microsoft/callback`);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    redirectUrl.searchParams.set('user', JSON.stringify(tokens.user));
    
    res.redirect(redirectUrl.toString());
  }

  @Post('update-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid current password' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updatePassword(
    @GetUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.authService.updatePassword(user.id, updatePasswordDto);
    return { message: 'Password updated successfully' };
  }
}

