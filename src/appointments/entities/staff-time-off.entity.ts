import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity({ name: 'staff_time_off' })
@Index(['gymId', 'staffId', 'date'])
export class StaffTimeOff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'staff_id' })
  staffId!: string;

  // YYYY-MM-DD (local Chile)
  @Column('date', { name: 'date' })
  date!: string;

  // si null-null => todo el día libre
  @Column('text', { name: 'start_time', nullable: true })
  startTime!: string | null;

  @Column('text', { name: 'end_time', nullable: true })
  endTime!: string | null;

  @Column('text', { name: 'reason', nullable: true })
  reason!: string | null;
}
