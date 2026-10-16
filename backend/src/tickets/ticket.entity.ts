import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum TicketStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum TicketPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  description: string;

  // Index: die Liste wird oft nach Status gefiltert.
  @Index()
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.Open })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.Medium })
  priority: TicketPriority;

  // Index: Kunden sehen nur ihre eigenen Tickets, also wird oft danach gesucht.
  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  assignee: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
