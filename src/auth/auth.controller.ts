import { Body, Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.gymId, dto.login, dto.password);
    const accessToken = this.auth.signToken(user);
    return {
      access_token: accessToken,
      user: this.auth.toAuthUser(user),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: JwtUser) {
    return this.auth.getProfile(user.sub, user.gymId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: any) {
    return this.auth.updateProfile(user.sub, user.gymId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser() user: JwtUser, @Body() dto: { currentPassword: string; newPassword: string }) {
    return this.auth.changePassword(user.sub, user.gymId, dto.currentPassword, dto.newPassword);
  }
}
