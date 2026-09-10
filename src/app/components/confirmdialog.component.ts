import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm" (click)="cancel.emit()">
      <div
        class="w-full max-w-sm rounded-2xl border border-ink-700/60 bg-surface p-6 shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <h2 class="font-display text-base font-semibold text-paper">{{ title() }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-paper/70">{{ message() }}</p>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            (click)="cancel.emit()"
            class="rounded-full px-4 py-2 text-sm font-semibold text-paper/70 transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            [disabled]="confirming()"
            class="rounded-full px-4 py-2 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50"
            [class]="danger() ? 'bg-rose-500' : 'bg-amber-500'"
          >
            {{ confirming() ? 'Aguarde…' : confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirmar');
  /** Vermelho em vez de âmbar — pra ações destrutivas, tipo excluir. */
  readonly danger = input<boolean>(false);
  readonly confirming = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}