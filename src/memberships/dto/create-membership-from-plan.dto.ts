import { IsUUID, IsOptional, Matches } from 'class-validator';

export class CreateMembershipFromPlanDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsUUID() planId!: string;

  /** YYYY-MM-DD (si no se envía, usa hoy en la TZ del server) */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  /** Notas opcionales */
  @IsOptional() note?: string;

  /** Usuario que ejecuta la acción (ADMIN) */
  @IsUUID() byUserId!: string;
}
