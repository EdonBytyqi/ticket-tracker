import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth.types';
import { Role, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Ticket } from './ticket.entity';
import { policyFor } from './ticket-update.policy';
import { CreateTicketDto, ListTicketsQuery, UpdateTicketDto } from './tickets.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    private readonly users: UsersService,
  ) {}

  create(user: AuthUser, dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.tickets.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      createdBy: { id: user.id } as User,
    });
    return this.tickets.save(ticket);
  }

  async findAll(user: AuthUser, query: ListTicketsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: FindOptionsWhere<Ticket> = {};
    if (query.status) where.status = query.status;
    // Kunden sehen ausschliesslich ihre eigenen Tickets.
    if (user.role === Role.Customer) where.createdBy = { id: user.id };

    const [items, total] = await this.tickets.findAndCount({
      where,
      relations: { createdBy: true, assignee: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(user: AuthUser, id: string): Promise<Ticket> {
    const ticket = await this.tickets.findOne({
      where: { id },
      relations: { createdBy: true, assignee: true },
    });
    // 404 statt 403: Kunden erfahren nicht, ob ein fremdes Ticket existiert.
    if (!ticket || (user.role === Role.Customer && ticket.createdBy.id !== user.id)) {
      throw new NotFoundException('Ticket nicht gefunden');
    }
    return ticket;
  }

  async update(user: AuthUser, id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(user, id);

    // Die Regeln pro Rolle stecken in der Policy. Hier wird nicht mehr auf der Rolle verzweigt.
    const policy = policyFor(user.role);
    policy.assertCanUpdate(ticket);
    policy.assertCanUpdateFields(dto);

    // Was die Policy durchgelassen hat, darf uebernommen werden.
    if (dto.title !== undefined) ticket.title = dto.title;
    if (dto.description !== undefined) ticket.description = dto.description;
    if (dto.status !== undefined) ticket.status = dto.status;
    if (dto.priority !== undefined) ticket.priority = dto.priority;
    if (dto.assigneeId !== undefined) ticket.assignee = await this.findAgent(dto.assigneeId);
    return this.tickets.save(ticket);
  }

  /** Zuweisen darf man nur an einen existierenden Agenten, nicht an Kunden oder erfundene IDs. */
  private async findAgent(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user || user.role !== Role.Agent) {
      throw new BadRequestException('Tickets koennen nur einem Agenten zugewiesen werden');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.tickets.delete(id);
    if (!result.affected) throw new NotFoundException('Ticket nicht gefunden');
  }
}
