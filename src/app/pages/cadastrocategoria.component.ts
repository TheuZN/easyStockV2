import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, CategoriesService } from '../services/categories.service';

@Component({
  selector: 'app-cadastro-categoria',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-lg px-4 py-8 sm:px-8">
      <h1 class="font-display text-2xl font-semibold text-paper">Categorias</h1>
      <p class="mt-1 text-sm text-paper/60">
        Cadastre aqui as categorias que podem ser usadas nos produtos — assim ninguém digita "Meia" numa hora e "meia" na outra.
      </p>

      <form (ngSubmit)="onRegister()" class="mt-6 flex gap-2">
        <input
          [(ngModel)]="newCategoryName"
          name="nome"
          type="text"
          placeholder="Nome da categoria"
          class="w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        />
        <button
          type="submit"
          [disabled]="saving() || !newCategoryName().trim()"
          class="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
        >
          {{ saving() ? 'Salvando…' : 'Adicionar' }}
        </button>
      </form>

      @if (errorMessage()) {
        <p class="mt-2 text-sm text-rose-500">{{ errorMessage() }}</p>
      }

      @if (loading()) {
        <p class="mt-8 text-sm text-paper/60">Carregando categorias…</p>
      } @else if (categories().length === 0) {
        <p class="mt-8 text-sm text-paper/60">Nenhuma categoria cadastrada ainda.</p>
      } @else {
        <ul class="mt-8 flex flex-col divide-y divide-ink-700/60">
          @for (category of categories(); track category.id) {
            <li class="py-3 text-sm text-paper">{{ category.nome }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export class CadastroCategoriaComponent {
  private readonly categoriesService = inject(CategoriesService);

  protected readonly newCategoryName = signal('');
  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoriesService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar as categorias agora.');
        this.loading.set(false);
      },
    });
  }

  protected onRegister(): void {
    const nome = this.newCategoryName().trim();
    if (!nome) {
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    this.categoriesService.add(nome).subscribe({
      next: (result) => {
        this.saving.set(false);
        if (result === 'duplicate') {
          this.errorMessage.set(`A categoria "${nome}" já está cadastrada.`);
          return;
        }
        this.newCategoryName.set('');
        this.loadCategories();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Não foi possível cadastrar a categoria agora.');
      },
    });
  }
}