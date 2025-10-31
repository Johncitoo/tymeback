import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity({ name: 'staff_availability' })
@Index(['gymId', 'staffId', 'weekday'])
export class StaffAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'staff_id' })
  staffId!: string;

  // 0=Lun .. 6=Dom  (consistente con GymHour.weekday)
  @Column('int', { name: 'weekday' })
  weekday!: number;

  @Column('boolean', { name: 'is_available', default: true })
  isAvailable!: boolean;

  // HH:mm (hora local Chile)
  @Column('text', { name: 'start_time' })
  startTime!: string;

  @Column('text', { name: 'end_time' })
  endTime!: string;
}
