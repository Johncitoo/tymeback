import { Body, Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtUser } from './current-user.decorator';
import { CommunicationsService } from '../communications/communications.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly communications: CommunicationsService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { user, gymUser, gymId } = await this.auth.validateUser(dto.gymSlug, dto.login, dto.password);
    
    // gymUser puede ser null para SUPER_ADMIN, pero siempre tendrá un rol
    const role = gymUser?.role || 'SUPER_ADMIN';
    
    // Obtener membershipStatus y datos completos si es cliente
    let membershipStatus: 'NONE' | 'ACTIVE' | 'EXPIRED' | undefined = undefined;
    let fullUserData: any = null;
    
    if (role === 'CLIENT') {
      membershipStatus = await this.auth.getMembershipStatus(user.id, gymId);
      fullUserData = await this.auth.getClientFullData(user.id, gymId);
    }
    
    const accessToken = this.auth.signToken(user, gymId, role as any);
    
    // Si es cliente y tenemos sus datos completos, devolver todo
    if (role === 'CLIENT' && fullUserData) {
      return {
        access_token: accessToken,
        user: {
          ...fullUserData,
          membershipStatus,
        },
      };
    }
    
    // Para otros roles, devolver solo datos básicos
    return {
      access_token: accessToken,
      user: {
        ...this.auth.toAuthUser(user, gymId, role as any),
        membershipStatus,
      },
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

  // ---------- Recuperación de Contraseña ----------
  
  @Post('forgot-password')
  async forgotPassword(@Body() dto: { email: string }) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'Si el correo existe, recibirás un enlace de recuperación' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: { token: string; newPassword: string }) {
    const result = await this.auth.resetPassword(dto.token, dto.newPassword);
    return result;
  }

  // ---------- Test Endpoints (solo para desarrollo) ----------
  
  @Post('test/send-activation-email')
  async testSendActivationEmail(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    activationToken: string;
  }) {
    await this.communications.sendAccountActivationEmail(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.activationToken,
    );
    return { message: 'Correo de activación enviado' };
  }

  @Post('test/send-password-reset')
  async testSendPasswordReset(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    resetToken: string;
  }) {
    await this.communications.sendPasswordResetEmail(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.resetToken,
    );
    return { message: 'Correo de recuperación de contraseña enviado' };
  }

  @Post('test/send-payment-confirmation')
  async testSendPaymentConfirmation(@Body() dto: {
    gymId: string;
    toEmail: string;
    clientName: string;
    planName: string;
    amount: number;
    paymentDate: string;
    discountClp?: number;
    promotionName?: string;
  }) {
    await this.communications.sendPaymentConfirmation(
      dto.gymId,
      'test-client-id',
      dto.toEmail,
      dto.clientName,
      dto.planName,
      dto.amount,
      dto.paymentDate,
      dto.discountClp,
      dto.promotionName,
    );
    return { message: 'Correo de confirmación de pago enviado' };
  }

  @Post('test/send-expiration-reminder')
  async testSendExpirationReminder(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    planName: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }) {
    await this.communications.sendExpirationReminder(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.planName,
      dto.expiryDate,
      dto.daysUntilExpiry,
    );
    return { message: 'Correo de recordatorio de vencimiento enviado' };
  }

  @Post('test/send-membership-expired')
  async testSendMembershipExpired(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    planName: string;
    expiryDate: string;
  }) {
    await this.communications.sendMembershipExpiredEmail(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.planName,
      dto.expiryDate,
    );
    return { message: 'Correo de membresía expirada enviado' };
  }
}
