import { Matches, IsObject } from 'class-validator';

/**
 * Guarda overrides por ejercicio para un cliente:
 * payload libre (validado en front): { type: 'NORMAL'|'DROPSET'|'TOPSET'|'SUPERSET'|'GIANT', parts: [{kg,reps},...], restSeconds, notes, ... }
 * El gymId se obtiene automáticamente del usuario autenticado
 */
export class UpdateExerciseOverrideDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  assignmentId!: string;

  /** ID del routine_day_exercise al que aplica el override */
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  rdeId!: string;

  @IsObject()
  override!: Record<string, any>;
}
