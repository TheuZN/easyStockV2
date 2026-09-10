import { Service, signal } from '@angular/core';

/** Estado de UI compartilhado entre Topbar (botão) e Sidebar (o menu em si). */
@Service()
export class UiStateService {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}