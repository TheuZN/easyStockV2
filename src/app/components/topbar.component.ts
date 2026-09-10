import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { UiStateService } from '../services/uistate.service';

@Component({
  selector: 'app-topbar',
  template: `
    <header class="flex items-center justify-between gap-4 border-b border-ink-700/60 px-4 py-4 sm:px-8">
      <button
        type="button"
        (click)="ui.toggleSidebar()"
        aria-label="Abrir menu"
        class="grid size-10 shrink-0 place-items-center rounded-xl text-paper/70 transition-colors hover:bg-ink-700/60 hover:text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none lg:hidden"
      >
        <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        </svg>
      </button>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
          class="grid size-10 place-items-center rounded-xl text-paper/70 transition-colors hover:bg-ink-700/60 hover:text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            @if (theme.theme() === 'dark') {
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.55 1.55M7.15 16.85l-1.55 1.55M18.4 18.4l-1.55-1.55M7.15 7.15 5.6 5.6"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            } @else {
              <path
                d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
            }
          </svg>
        </button>

        <div class="ml-1 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <div class="grid size-8 place-items-center rounded-full bg-ink-700/60 text-xs font-semibold text-paper">
            {{ userInitial }}
          </div>
          <span class="hidden text-sm font-medium text-paper sm:block">{{ userName }}</span>
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly ui = inject(UiStateService);

  // Mock — vem da conta autenticada quando o login for ligado.
  protected readonly userName = 'Mateus';
  protected readonly userInitial = 'M';
}