import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UiStateService } from '../services/uistate.service';
import { AuthService } from '../services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Início', path: '/', icon: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  { label: 'Produtos', path: '/produtos', icon: 'M4 7.5 12 4l8 3.5M4 7.5v9L12 20m-8-3.5L12 13m0 7 8-3.5v-9M12 13l8-5.5M12 13V4' },
  { label: 'Cadastro', path: '/cadastro', icon: 'M12 5v14M5 12h14' },
  { label: 'Marcas', path: '/marcas', icon: 'M20.5 12.3 12.7 20a1.5 1.5 0 0 1-2.1 0L4 13.4a1.5 1.5 0 0 1 0-2.1L11.7 3.6a1.5 1.5 0 0 1 1.1-.4h5.2A1.5 1.5 0 0 1 19.5 4.7v5.2c0 .4-.2.8-.4 1.1z' },
  { label: 'Categorias', path: '/categorias', icon: 'M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Fundo escuro atrás do menu, só no mobile — clicar nele fecha -->
    @if (ui.sidebarOpen()) {
      <div class="fixed inset-0 z-40 bg-ink-950/70 lg:hidden" (click)="ui.closeSidebar()"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-50 flex h-full w-60 shrink-0 flex-col border-r border-ink-700/60 bg-surface px-4 py-6 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-surface/40"
      [class.-translate-x-full]="!ui.sidebarOpen()"
      [class.translate-x-0]="ui.sidebarOpen()"
    >
      <div class="flex items-center justify-between gap-2.5 px-2">
        <div class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-lg bg-amber-500 text-sm font-bold text-ink-950">E</span>
          <span class="font-display text-lg font-semibold text-paper">EasyStock</span>
        </div>

        <button
          type="button"
          (click)="ui.closeSidebar()"
          aria-label="Fechar menu"
          class="grid size-8 place-items-center rounded-lg text-paper/60 transition-colors hover:bg-ink-700/60 hover:text-paper lg:hidden"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <nav class="mt-10 flex flex-col gap-1" aria-label="Principal">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            routerLinkActive="bg-amber-500 !text-ink-950 font-semibold"
            (click)="ui.closeSidebar()"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper/65 transition-colors hover:bg-ink-700/60 hover:text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path [attr.d]="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="mt-auto flex flex-col gap-1 pt-6">
        <button
          type="button"
          (click)="onLogout()"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper/65 transition-colors hover:bg-ink-700/60 hover:text-paper focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M14.5 12H3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly ui = inject(UiStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.ui.closeSidebar();
      this.router.navigateByUrl('/login');
    });
  }
}