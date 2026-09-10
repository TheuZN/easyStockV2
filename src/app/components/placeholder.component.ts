import { Component, input } from '@angular/core';
 
/** Página provisória — vira a tela real na próxima etapa. */
@Component({
  selector: 'app-placeholder',
  template: `
    <div class="flex h-full flex-col items-center justify-center gap-2 px-8 py-16 text-center">
      <h1 class="font-display text-xl font-semibold text-paper">{{ title() }}</h1>
      <p class="max-w-xs text-sm text-paper/60">Essa tela ainda está em construção.</p>
    </div>
  `,
})
export class PlaceholderComponent {
  readonly title = input.required<string>();
}
 