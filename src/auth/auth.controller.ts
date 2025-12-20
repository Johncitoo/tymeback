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
    const { user, gymUser, gymId } = await this.auth.validateUser(dto.gymSlug, dto.login, dto.password);
    
    // gymUser puede ser null para SUPER_ADMIN, pero siempre tendrá un rol
    const role = gymUser?.role || 'SUPER_ADMIN';
    
    const accessToken = this.auth.signToken(user, gymId, role as any);
    return {
      access_token: accessToken,
      user: this.auth.toAuthUser(user, gymId, role as any),
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
    return this.auth.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: any) {
    return this.auth.updateProfile(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser() user: JwtUser, @Body() dto: { currentPassword: string; newPassword: string }) {
    return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }

  // ---------- Activación de Cuenta ----------
  
  @Post('verify-activation-token')
  async verifyActivationToken(@Body() dto: { token: string }) {
    const result = await this.auth.verifyActivationToken(dto.token);
    return result;
  }

  @Post('activate-account')
  async activateAccount(@Body() dto: { token: string; newPassword: string }) {
    const result = await this.auth.activateAccount(dto.token, dto.newPassword);
    return result;
  }
}
