import { IsUUID, IsObject } from 'class-validator';

/**
 * Guarda overrides por ejercicio para un cliente:
 * payload libre (validado en front): { type: 'NORMAL'|'DROPSET'|'TOPSET'|'SUPERSET'|'GIANT', parts: [{kg,reps},...], restSeconds, notes, ... }
 */
export class UpdateExerciseOverrideDto {
  @IsUUID('all')
  gymId!: string;

  @IsUUID('all')
  assignmentId!: string;

  /** ID del routine_day_exercise al que aplica el override */
  @IsUUID('all')
  rdeId!: string;

  @IsObject()
  override!: Record<string, any>;
}
