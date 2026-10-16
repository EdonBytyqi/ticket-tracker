import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Role } from '../users/user.entity';
import { Ticket, TicketStatus } from './ticket.entity';
import { UpdateTicketDto } from './tickets.dto';

/**
 * Beschreibt, was eine Rolle beim Aendern eines Tickets darf.
 * Der Service fragt die Policy und verzweigt nie selbst auf der Rolle.
 * Beide Methoden werfen bei einer Regelverletzung (laut scheitern statt still ignorieren).
 */
export interface TicketUpdatePolicy {
  /** Darf diese Rolle dieses Ticket im aktuellen Zustand ueberhaupt bearbeiten? */
  assertCanUpdate(ticket: Ticket): void;

  /** Enthaelt der Request nur Felder, die diese Rolle aendern darf? */
  assertCanUpdateFields(dto: UpdateTicketDto): void;
}

export class CustomerTicketUpdatePolicy implements TicketUpdatePolicy {
  assertCanUpdate(ticket: Ticket): void {
    if (ticket.status !== TicketStatus.Open) {
      throw new ForbiddenException('Nur offene Tickets koennen bearbeitet werden');
    }
  }

  assertCanUpdateFields(dto: UpdateTicketDto): void {
    if (dto.status !== undefined || dto.priority !== undefined || dto.assigneeId !== undefined) {
      throw new ForbiddenException('Status, Prioritaet und Zuweisung duerfen nur Agenten aendern');
    }
  }
}

export class AgentTicketUpdatePolicy implements TicketUpdatePolicy {
  assertCanUpdate(): void {
    // Agenten duerfen Tickets in jedem Zustand bearbeiten.
  }

  assertCanUpdateFields(): void {
    // Agenten duerfen alle Felder aendern.
  }
}

/**
 * Record<Role, ...> zwingt den Compiler: Wer Role.Manager zum Enum hinzufuegt,
 * bekommt einen Build-Fehler, bis hier eine Policy dafuer eingetragen ist.
 */
const policies: Record<Role, TicketUpdatePolicy> = {
  [Role.Customer]: new CustomerTicketUpdatePolicy(),
  [Role.Agent]: new AgentTicketUpdatePolicy(),
};

/**
 * Laufzeit-Sicherheitsnetz (z. B. altes Token mit einer Rolle, die es nicht mehr gibt).
 * Eine fehlende Policy ist ein Programmier- bzw. Konfigurationsfehler, kein Benutzerfehler:
 * deshalb 500 (wird geloggt), nicht 403.
 */
export function policyFor(role: Role): TicketUpdatePolicy {
  const policy = policies[role];
  if (!policy) {
    throw new InternalServerErrorException(`Keine Update-Policy fuer Rolle "${role}"`);
  }
  return policy;
}
