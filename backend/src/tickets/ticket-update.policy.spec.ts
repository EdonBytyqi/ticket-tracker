import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Role } from '../users/user.entity';
import { Ticket, TicketPriority, TicketStatus } from './ticket.entity';
import {
  AgentTicketUpdatePolicy,
  CustomerTicketUpdatePolicy,
  policyFor,
} from './ticket-update.policy';

const ticketWith = (status: TicketStatus) => ({ status }) as Ticket;

describe('CustomerTicketUpdatePolicy', () => {
  const policy = new CustomerTicketUpdatePolicy();

  it('erlaubt das Bearbeiten offener Tickets', () => {
    expect(() => policy.assertCanUpdate(ticketWith(TicketStatus.Open))).not.toThrow();
  });

  it.each([TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Closed])(
    'verbietet das Bearbeiten bei Status %s',
    (status) => {
      expect(() => policy.assertCanUpdate(ticketWith(status))).toThrow(ForbiddenException);
    },
  );

  it('erlaubt Titel und Beschreibung', () => {
    expect(() => policy.assertCanUpdateFields({ title: 'Neu', description: 'Text' })).not.toThrow();
  });

  it.each([
    ['status', { status: TicketStatus.Closed }],
    ['priority', { priority: TicketPriority.High }],
    ['assigneeId', { assigneeId: '5b2a8a5e-9b53-4b0e-93e6-6f7d9e1d2c3b' }],
  ])('verbietet das Feld %s', (_name, dto) => {
    expect(() => policy.assertCanUpdateFields(dto)).toThrow(ForbiddenException);
  });
});

describe('AgentTicketUpdatePolicy', () => {
  const policy = new AgentTicketUpdatePolicy();

  it('erlaubt Agenten jeden Ticket-Zustand und alle Felder', () => {
    expect(() => policy.assertCanUpdate()).not.toThrow();
    expect(() => policy.assertCanUpdateFields()).not.toThrow();
  });
});

describe('policyFor', () => {
  it('liefert die passende Policy pro Rolle', () => {
    expect(policyFor(Role.Customer)).toBeInstanceOf(CustomerTicketUpdatePolicy);
    expect(policyFor(Role.Agent)).toBeInstanceOf(AgentTicketUpdatePolicy);
  });

  it('wirft einen 500er-Fehler fuer eine Rolle ohne Policy (nie still ignorieren)', () => {
    expect(() => policyFor('manager' as Role)).toThrow(InternalServerErrorException);
  });
});
