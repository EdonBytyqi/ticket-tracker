import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthUser } from '../auth/auth.types';
import { Role } from '../users/user.entity';
import { Ticket, TicketStatus } from './ticket.entity';
import { UsersService } from '../users/users.service';
import { TicketsService } from './tickets.service';

const customer: AuthUser = { id: 'c-1', email: 'kunde@example.com', role: Role.Customer };
const otherCustomer: AuthUser = { id: 'c-2', email: 'anderer@example.com', role: Role.Customer };
const agent: AuthUser = { id: 'a-1', email: 'agent@example.com', role: Role.Agent };

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't-1',
    title: 'Drucker streikt',
    description: 'Seit heute morgen keine Ausdrucke',
    status: TicketStatus.Open,
    priority: 'medium',
    createdBy: { id: customer.id },
    assignee: null,
    ...overrides,
  } as Ticket;
}

describe('TicketsService', () => {
  let service: TicketsService;
  const repo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  };
  const users = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: repo },
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    service = moduleRef.get(TicketsService);
  });

  it('setzt beim Erstellen den Ersteller', async () => {
    await service.create(customer, { title: 'Neu', description: 'Text' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: { id: customer.id } }),
    );
  });

  it('beschraenkt die Liste fuer Kunden auf eigene Tickets', async () => {
    repo.findAndCount.mockResolvedValue([[], 0]);
    await service.findAll(customer, {});
    const arg = repo.findAndCount.mock.calls[0][0];
    expect(arg.where.createdBy).toEqual({ id: customer.id });
  });

  it('zeigt Agenten alle Tickets (kein Ersteller-Filter)', async () => {
    repo.findAndCount.mockResolvedValue([[], 0]);
    await service.findAll(agent, {});
    const arg = repo.findAndCount.mock.calls[0][0];
    expect(arg.where.createdBy).toBeUndefined();
  });

  it('liefert fuer fremde Tickets 404 statt 403', async () => {
    repo.findOne.mockResolvedValue(makeTicket());
    await expect(service.findOne(otherCustomer, 't-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('verbietet Kunden, den Status zu aendern', async () => {
    repo.findOne.mockResolvedValue(makeTicket());
    await expect(
      service.update(customer, 't-1', { status: TicketStatus.Closed }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('verbietet Kunden, ein nicht offenes Ticket zu bearbeiten', async () => {
    repo.findOne.mockResolvedValue(makeTicket({ status: TicketStatus.InProgress }));
    await expect(service.update(customer, 't-1', { title: 'Anders' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('erlaubt Agenten, Status und Zuweisung zu aendern', async () => {
    repo.findOne.mockResolvedValue(makeTicket());
    users.findById.mockResolvedValue({ id: agent.id, role: Role.Agent });
    const result = await service.update(agent, 't-1', {
      status: TicketStatus.InProgress,
      assigneeId: agent.id,
    });
    expect(result.status).toBe(TicketStatus.InProgress);
    expect(result.assignee).toEqual({ id: agent.id, role: Role.Agent });
  });

  it('lehnt die Zuweisung an einen Kunden ab', async () => {
    repo.findOne.mockResolvedValue(makeTicket());
    users.findById.mockResolvedValue({ id: customer.id, role: Role.Customer });
    await expect(service.update(agent, 't-1', { assigneeId: customer.id })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lehnt die Zuweisung an eine unbekannte ID ab', async () => {
    repo.findOne.mockResolvedValue(makeTicket());
    users.findById.mockResolvedValue(null);
    await expect(service.update(agent, 't-1', { assigneeId: 'gibt-es-nicht' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('scheitert laut bei einer Rolle ohne Policy, statt Felder still zu ignorieren', async () => {
    const manager = { id: 'm-1', email: 'manager@example.com', role: 'manager' } as unknown as AuthUser;
    repo.findOne.mockResolvedValue(makeTicket());
    await expect(service.update(manager, 't-1', { status: TicketStatus.Closed })).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('wirft 404 beim Loeschen eines unbekannten Tickets', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
