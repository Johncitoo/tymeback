import { IsArray, IsOptional, IsUUID } from 'class-validator';

/**
 * Crea asignaciones 1..N para distintos clientes y congela snapshot.
 */
export class AssignRoutineDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  routineId!: string;

  @IsUUID()
  assignedByUserId!: string;

  @IsArray()
  clientIds!: string[];
}
