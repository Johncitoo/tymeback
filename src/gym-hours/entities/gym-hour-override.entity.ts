import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'gym_hour_overrides' })
@Index(['gymId', 'date'], { unique: true })
export class GymHourOverride {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  /** YYYY-MM-DD (DATE) */
  @Column({ type: 'date', name: 'date' })
  date!: string;

  /** true = abierto ese día (override) */
  @Column('boolean', { name: 'is_open', default: false })
  isOpen!: boolean;

  /** HH:mm (local) o null si isOpen=false */
  @Column('text', { name: 'open_time', nullable: true })
  openTime!: string | null;

  /** HH:mm (local) o null si isOpen=false */
  @Column('text', { name: 'close_time', nullable: true })
  closeTime!: string | null;

  /** Motivo del override */
  @Column('text', { name: 'note', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
