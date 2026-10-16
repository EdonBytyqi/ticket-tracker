import { TestBed } from '@angular/core/testing';
import { Ticket } from '../../core/models';
import { AgentUpdate, TicketAgentPanel } from './ticket-agent-panel';
import { ContentUpdate, TicketContentForm } from './ticket-content-form';

const ticket: Ticket = {
  id: 't-1',
  title: 'Drucker streikt',
  description: 'Keine Ausdrucke seit heute',
  status: 'in_progress',
  priority: 'high',
  createdAt: '2026-10-14T10:00:00Z',
  updatedAt: '2026-10-14T10:00:00Z',
};

describe('TicketAgentPanel', () => {
  it('uebernimmt Status und Prioritaet des Tickets ins Formular', async () => {
    const fixture = TestBed.createComponent(TicketAgentPanel);
    fixture.componentRef.setInput('ticket', ticket);
    await fixture.whenStable();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ status: 'in_progress', priority: 'high' });
  });

  it('meldet die geaenderten Werte, ohne selbst die API zu kennen', async () => {
    const fixture = TestBed.createComponent(TicketAgentPanel);
    fixture.componentRef.setInput('ticket', ticket);
    await fixture.whenStable();

    const emitted: AgentUpdate[] = [];
    fixture.componentInstance.save.subscribe((v) => emitted.push(v));
    fixture.componentInstance.form.patchValue({ status: 'resolved' });
    fixture.componentInstance.submit();

    expect(emitted).toEqual([{ status: 'resolved', priority: 'high' }]);
  });
});

describe('TicketContentForm', () => {
  it('sendet nichts, solange das Formular ungueltig ist', async () => {
    const fixture = TestBed.createComponent(TicketContentForm);
    fixture.componentRef.setInput('ticket', ticket);
    await fixture.whenStable();

    const emitted: ContentUpdate[] = [];
    fixture.componentInstance.save.subscribe((v) => emitted.push(v));
    fixture.componentInstance.form.patchValue({ title: 'ab' }); // zu kurz (min. 3)
    fixture.componentInstance.submit();

    expect(emitted).toEqual([]);
  });

  it('sendet gueltige Werte', async () => {
    const fixture = TestBed.createComponent(TicketContentForm);
    fixture.componentRef.setInput('ticket', ticket);
    await fixture.whenStable();

    const emitted: ContentUpdate[] = [];
    fixture.componentInstance.save.subscribe((v) => emitted.push(v));
    fixture.componentInstance.form.patchValue({ title: 'Drucker defekt' });
    fixture.componentInstance.submit();

    expect(emitted).toEqual([{ title: 'Drucker defekt', description: 'Keine Ausdrucke seit heute' }]);
  });
});
