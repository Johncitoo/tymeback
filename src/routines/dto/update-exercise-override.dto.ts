import { IsUUID, IsObject } from 'class-validator';

/**
 * Guarda overrides por ejercicio para un cliente:
 * payload libre (validado en front): { type: 'NORMAL'|'DROPSET'|'TOPSET'|'SUPERSET'|'GIANT', parts: [{kg,reps},...], restSeconds, notes, ... }
 */
export class UpdateExerciseOverrideDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  assignmentId!: string;

  /** ID del routine_day_exercise al que aplica el override */
  @IsUUID()
  rdeId!: string;

  @IsObject()
  override!: Record<string, any>;
}
