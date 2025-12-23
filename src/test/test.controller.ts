import { Controller, Post, Body } from '@nestjs/common';
import { CommunicationsService } from '../communications/communications.service';

@Controller('test')
export class TestController {
  constructor(private readonly commsService: CommunicationsService) {}

  @Post('send-activation-email')
  async sendActivationEmail(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    activationToken: string;
  }) {
    await this.commsService.sendAccountActivationEmail(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.activationToken
    );
    return { success: true, message: 'Correo de activación enviado' };
  }

  @Post('send-password-reset-email')
  async sendPasswordResetEmail(@Body() dto: {
    gymId: string;
    userId: string;
    toEmail: string;
    userName: string;
    resetToken: string;
  }) {
    await this.commsService.sendPasswordResetEmail(
      dto.gymId,
      dto.userId,
      dto.toEmail,
      dto.userName,
      dto.resetToken
    );
    return { success: true, message: 'Correo de recuperación enviado' };
  }

  @Post('send-payment-confirmation')
  async sendPaymentConfirmation(@Body() dto: {
    gymId: string;
    toEmail: string;
    clientName: string;
    planName: string;
    amount: number;
    paymentDate: string;
  }) {
    // Mock clientId
    await this.commsService.sendPaymentConfirmation(
      dto.gymId,
      'test-client-id',
      dto.toEmail,
      dto.clientName,
      dto.planName,
      dto.amount,
      dto.paymentDate
    );
    return { success: true, message: 'Correo de pago enviado' };
  }

  @Post('send-expiration-reminder')
  async sendExpirationReminder(@Body() dto: {
    gymId: string;
    userId: string;
    userEmail: string;
    userName: string;
    planName: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }) {
    await this.commsService.sendExpirationReminder(
      dto.gymId,
      dto.userId,
      dto.userEmail,
      dto.userName,
      dto.planName,
      dto.expiryDate,
      dto.daysUntilExpiry
    );
    return { success: true, message: 'Correo de recordatorio enviado' };
  }
}
