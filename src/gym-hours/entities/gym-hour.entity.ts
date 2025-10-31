import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'gym_hours' })
@Index(['gymId', 'dayOfWeek'], { unique: true })
export class GymHour {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  /** 0 = Domingo .. 6 = Sábado */
  @Column('int', { name: 'day_of_week' })
  dayOfWeek!: number;

  /** true = abierto ese día */
  @Column('boolean', { name: 'is_open', default: false })
  isOpen!: boolean;

  /** HH:mm (local) o null si isOpen=false */
  @Column('text', { name: 'open_time', nullable: true })
  openTime!: string | null;

  /** HH:mm (local) o null si isOpen=false */
  @Column('text', { name: 'close_time', nullable: true })
  closeTime!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
