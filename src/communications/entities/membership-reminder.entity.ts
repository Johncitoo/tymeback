import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity({ name: 'membership_reminders' })
@Index(['gymId', 'membershipId', 'daysBefore'], { unique: true })
export class MembershipReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'membership_id' })
  membershipId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('int', { name: 'days_before' })
  daysBefore!: number; // 7, 3, 1

  @Column('timestamptz', { name: 'sent_at' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
