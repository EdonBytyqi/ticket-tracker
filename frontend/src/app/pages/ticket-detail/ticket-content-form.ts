import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Ticket } from '../../core/models';

export interface ContentUpdate {
  title: string;
  description: string;
}

/** Formular fuer Titel und Beschreibung, inklusive Validierung. */
@Component({
  selector: 'app-ticket-content-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <h2>Inhalt</h2>
      <label>
        Titel
        <input formControlName="title" />
      </label>
      <label>
        Beschreibung
        <textarea rows="6" formControlName="description"></textarea>
      </label>
      <button type="submit" [disabled]="form.invalid || busy()">Inhalt speichern</button>
    </form>
  `,
})
export class TicketContentForm {
  readonly ticket = input.required<Ticket>();
  readonly busy = input(false);
  readonly save = output<ContentUpdate>();

  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  constructor() {
    effect(() => {
      const t = this.ticket();
      this.form.patchValue({ title: t.title, description: t.description });
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.save.emit(this.form.getRawValue());
  }
}
