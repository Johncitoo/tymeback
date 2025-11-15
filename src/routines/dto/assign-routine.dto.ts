import { IsArray, IsOptional, IsUUID, ArrayMinSize } from 'class-validator';

/**
 * Crea asignaciones 1..N para distintos clientes y congela snapshot.
 */
export class AssignRoutineDto {
  @IsOptional()
  @IsUUID('all')
  gymId?: string;

  @IsUUID('all')
  routineId!: string;

  @IsOptional()
  @IsUUID('all')
  assignedByUserId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  clientIds!: string[];
}
