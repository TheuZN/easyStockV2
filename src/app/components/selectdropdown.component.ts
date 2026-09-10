import { Component, computed, input, output, signal } from '@angular/core';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select-dropdown',
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-left text-sm text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        <span [class]="selectedLabel() ? 'text-paper' : 'text-paper/40'">{{ selectedLabel() || placeholder() }}</span>
        <svg class="size-4 shrink-0 text-paper/50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      @if (open()) {
        <div class="fixed inset-0 z-40" (click)="open.set(false)"></div>
        <div class="absolute top-full left-0 z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-ink-700/60 bg-surface p-1.5 shadow-2xl">
          @if (options().length === 0) {
            <p class="px-3 py-2 text-sm text-paper/50">Nenhuma opção cadastrada.</p>
          }
          @for (opt of options(); track opt.value) {
            <button
              type="button"
              (click)="select(opt.value)"
              class="block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-ink-700/60"
              [class]="opt.value === value() ? 'font-semibold text-paper' : 'text-paper/75'"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class SelectDropdownComponent {
  readonly options = input.required<SelectOption[]>();
  readonly value = input<string>('');
  readonly placeholder = input<string>('Selecione');
  readonly valueChange = output<string>();

  protected readonly open = signal(false);
  protected readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? '');

  protected select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
  }
}