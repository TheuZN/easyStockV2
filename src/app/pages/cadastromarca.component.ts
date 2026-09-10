import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Brand, BrandsService } from '../services/brands.service';

@Component({
  selector: 'app-cadastro-marca',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-lg px-4 py-8 sm:px-8">
      <h1 class="font-display text-2xl font-semibold text-paper">Marcas</h1>
      <p class="mt-1 text-sm text-paper/60">
        Cadastre aqui as marcas que podem ser usadas nos produtos — assim ninguém digita "Lupo" numa hora e "lupo" na outra.
      </p>

      <form (ngSubmit)="onRegister()" class="mt-6 flex gap-2">
        <input
          [(ngModel)]="newBrandName"
          name="nome"
          type="text"
          placeholder="Nome da marca"
          class="w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        />
        <button
          type="submit"
          [disabled]="saving() || !newBrandName().trim()"
          class="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
        >
          {{ saving() ? 'Salvando…' : 'Adicionar' }}
        </button>
      </form>

      @if (errorMessage()) {
        <p class="mt-2 text-sm text-rose-500">{{ errorMessage() }}</p>
      }

      @if (loading()) {
        <p class="mt-8 text-sm text-paper/60">Carregando marcas…</p>
      } @else if (brands().length === 0) {
        <p class="mt-8 text-sm text-paper/60">Nenhuma marca cadastrada ainda.</p>
      } @else {
        <ul class="mt-8 flex flex-col divide-y divide-ink-700/60">
          @for (brand of brands(); track brand.id) {
            <li class="py-3 text-sm text-paper">{{ brand.nome }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export class CadastroMarcaComponent {
  private readonly brandsService = inject(BrandsService);

  protected readonly newBrandName = signal('');
  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly brands = signal<Brand[]>([]);

  constructor() {
    this.loadBrands();
  }

  private loadBrands(): void {
    this.loading.set(true);
    this.brandsService.list().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar as marcas agora.');
        this.loading.set(false);
      },
    });
  }

  protected onRegister(): void {
    const nome = this.newBrandName().trim();
    if (!nome) {
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    this.brandsService.add(nome).subscribe({
      next: (result) => {
        this.saving.set(false);
        if (result === 'duplicate') {
          this.errorMessage.set(`A marca "${nome}" já está cadastrada.`);
          return;
        }
        this.newBrandName.set('');
        this.loadBrands();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Não foi possível cadastrar a marca agora.');
      },
    });
  }
}