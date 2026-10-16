import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Ticket, TicketPriority, TicketStatus } from '../../core/models';

export interface AgentUpdate {
  status: TicketStatus;
  priority: TicketPriority;
}

/**
 * Bearbeitungsbereich fuer Agenten: Status, Prioritaet, Loeschen.
 * Kennt weder die API noch die Seite, sondern nimmt ein Ticket entgegen und meldet Absichten per Event.
 */
@Component({
  selector: 'app-ticket-agent-panel',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <h2>Bearbeitung (Agent)</h2>
      <label>
        Status
        <select formControlName="status">
          <option value="open">Offen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="resolved">Geloest</option>
          <option value="closed">Geschlossen</option>
        </select>
      </label>
      <label>
        Prioritaet
        <select formControlName="priority">
          <option value="low">Niedrig</option>
          <option value="medium">Mittel</option>
          <option value="high">Hoch</option>
        </select>
      </label>
      <div class="row">
        <button type="submit" [disabled]="busy()">Speichern</button>
        <button type="button" class="danger" (click)="remove.emit()" [disabled]="busy()">Loeschen</button>
      </div>
    </form>
  `,
})
export class TicketAgentPanel {
  readonly ticket = input.required<Ticket>();
  readonly busy = input(false);
  readonly save = output<AgentUpdate>();
  readonly remove = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    status: ['open' as TicketStatus],
    priority: ['medium' as TicketPriority],
  });

  constructor() {
    // Das Formular folgt dem Ticket, das von aussen kommt.
    effect(() => {
      const t = this.ticket();
      this.form.patchValue({ status: t.status, priority: t.priority });
    });
  }

  submit() {
    this.save.emit(this.form.getRawValue());
  }
}
