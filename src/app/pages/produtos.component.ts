import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariation, ProductsService } from '../services/product.service';
import { ConfirmDialogComponent } from '../components/confirmdialog.component';
import { SelectDropdownComponent, SelectOption } from '../components/selectdropdown.component';

type StockFilter = 'todos' | 'baixo' | 'sem-estoque';

const LOW_STOCK_THRESHOLD = 5;
const ALL_BRANDS = 'todas';
const ALL_CATEGORIES = 'todas';

interface ProductRow extends Product {
  totalStock: number;
  status: 'em-estoque' | 'baixo' | 'sem-estoque';
}

interface StockEditTarget {
  product: ProductRow;
  variacao: ProductVariation;
}

const STATUS_LABEL: Record<ProductRow['status'], string> = {
  'em-estoque': 'Em estoque',
  baixo: 'Estoque baixo',
  'sem-estoque': 'Sem estoque',
};

const STATUS_CLASS: Record<ProductRow['status'], string> = {
  'em-estoque': 'bg-sage-500/15 text-sage-500',
  baixo: 'bg-amber-500/15 text-amber-500',
  'sem-estoque': 'bg-rose-500/15 text-rose-500',
};

@Component({
  selector: 'app-produtos',
  imports: [FormsModule, ConfirmDialogComponent, SelectDropdownComponent],
  template: `
    <div class="px-4 py-8 sm:px-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-semibold text-paper">Produtos</h1>
          <p class="mt-1 text-sm text-paper/60">{{ filtered().length }} de {{ products().length }} produtos</p>
        </div>

        <label class="flex w-full max-w-xs items-center gap-2.5 rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5">
          <svg class="size-[18px] shrink-0 text-paper/50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
            <path d="m16.2 16.2 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
          <input
            type="search"
            [(ngModel)]="searchTerm"
            placeholder="Buscar por nome ou SKU"
            class="w-full bg-transparent text-sm text-paper placeholder:text-paper/40 focus:outline-none"
          />
        </label>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        <!-- Status de estoque continua em pills — são só 3 opções fixas, dropdown seria exagero.
             No mobile, os 3 dividem a largura da linha; a partir do sm, voltam ao tamanho do texto. -->
        <div class="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          @for (option of statusOptions; track option.value) {
            <button
              type="button"
              (click)="statusFilter.set(option.value)"
              class="rounded-full px-4 py-1.5 text-center text-sm font-semibold transition-colors"
              [class]="statusFilter() === option.value ? 'bg-amber-500 text-ink-950' : 'bg-surface/40 text-paper/70 hover:text-paper'"
            >
              {{ option.label }}
            </button>
          }
        </div>

        <!-- Marca e categoria: dropdown de verdade, não pills -->
        @if (brandOptions().length > 1) {
          <div class="w-48">
            <app-select-dropdown
              [options]="brandOptions()"
              [value]="brandFilter()"
              (valueChange)="brandFilter.set($event)"
            />
          </div>
        }

        @if (categoryOptions().length > 1) {
          <div class="w-48">
            <app-select-dropdown
              [options]="categoryOptions()"
              [value]="categoryFilter()"
              (valueChange)="categoryFilter.set($event)"
            />
          </div>
        }
      </div>

      @if (loading()) {
        <div class="mt-8 flex flex-col gap-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-20 animate-pulse rounded-2xl bg-surface/40"></div>
          }
        </div>
      } @else if (errorMessage()) {
        <p class="mt-8 text-sm text-rose-500">{{ errorMessage() }}</p>
      } @else if (filtered().length === 0) {
        <p class="mt-8 text-sm text-paper/60">Nenhum produto encontrado.</p>
      } @else {
        <div class="mt-6 flex flex-col gap-3">
          @for (product of filtered(); track product.id) {
            <div class="rounded-2xl border border-ink-700/60 bg-surface/40">
              <div class="flex items-center gap-2 px-5 py-4">
                <button
                  type="button"
                  (click)="toggleExpanded(product.id)"
                  class="flex flex-1 flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div class="flex items-center gap-4">
                    <svg
                      class="size-4 shrink-0 text-paper/50 transition-transform"
                      [class.rotate-90]="expandedId() === product.id"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-paper">{{ product.nome }}</p>
                      <p class="mt-0.5 text-xs text-paper/50">
                        {{ product.SKUPai }}
                        @if (product.marca) {
                          · {{ product.marca }}
                        }
                        @if (product.categoria) {
                          · {{ product.categoria }}
                        }
                        · {{ product.variacoes.length }} variações
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <span class="text-sm font-medium text-paper">{{ product.totalStock }} un.</span>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="statusClass[product.status]">
                      {{ statusLabel[product.status] }}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="requestDelete(product)"
                  aria-label="Excluir produto"
                  class="grid size-8 shrink-0 place-items-center rounded-full text-paper/40 transition-colors hover:bg-rose-500/15 hover:text-rose-500"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .7 12.1a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L18 7"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              @if (expandedId() === product.id) {
                <div class="border-t border-ink-700/60 px-5 py-4">
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    @for (variacao of product.variacoes; track variacao.id) {
                      <button
                        type="button"
                        (click)="openStockEdit(product, variacao)"
                        class="flex items-center justify-between gap-3 rounded-xl bg-ink-950/40 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-ink-950/70"
                      >
                        <div>
                          <p class="text-paper">{{ variacao.SKUFilho }}</p>
                          <p class="mt-0.5 text-xs text-paper/50">{{ variacao.tamanhoVariacao }} · {{ variacao.corVariacao }}</p>
                        </div>

                        <div class="flex items-center gap-2">
                          <span
                            class="font-display font-semibold"
                            [class.text-rose-500]="variacao.estoqueVariacao === 0"
                            [class.text-amber-500]="variacao.estoqueVariacao > 0 && variacao.estoqueVariacao <= lowStockThreshold"
                            [class.text-paper]="variacao.estoqueVariacao > lowStockThreshold"
                          >
                            {{ variacao.estoqueVariacao }} un.
                          </span>
                          <svg class="size-4 shrink-0 text-paper/40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="m16.5 4.5 3 3L8 19l-4 1 1-4Z"
                              stroke="currentColor"
                              stroke-width="1.6"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </div>
                      </button>
                    }
                  </div>

                  @if (stockErrorId() === product.id) {
                    <p class="mt-3 text-xs text-rose-500">Não foi possível atualizar esse estoque agora.</p>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (deleteTarget(); as product) {
      <app-confirm-dialog
        title="Excluir produto"
        [message]="deleteMessage(product)"
        confirmLabel="Excluir"
        [danger]="true"
        [confirming]="confirming()"
        (confirm)="confirmDelete()"
        (cancel)="deleteTarget.set(null)"
      />
    }

    @if (stockEditTarget(); as target) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm" (click)="closeStockEdit()">
        <div class="w-full max-w-sm rounded-2xl border border-ink-700/60 bg-surface p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <h2 class="font-display text-base font-semibold text-paper">Atualizar estoque</h2>
          <p class="mt-1 text-sm text-paper/60">
            {{ target.variacao.SKUFilho }} · {{ target.variacao.tamanhoVariacao }} · {{ target.variacao.corVariacao }}
          </p>

          <label class="mt-5 block text-sm font-medium text-paper/80">Quantidade em estoque</label>
          <input
            type="number"
            min="0"
            [(ngModel)]="stockEditValue"
            class="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          />

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              (click)="closeStockEdit()"
              class="rounded-full px-4 py-2 text-sm font-semibold text-paper/70 transition-colors hover:text-paper"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="confirmStockEdit()"
              [disabled]="confirming() || stockEditValue() === target.variacao.estoqueVariacao"
              class="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {{ confirming() ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProdutosComponent {
  private readonly productsService = inject(ProductsService);

  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusClass = STATUS_CLASS;

  protected readonly statusOptions: { label: string; value: StockFilter }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Estoque baixo', value: 'baixo' },
    { label: 'Sem estoque', value: 'sem-estoque' },
  ];

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<StockFilter>('todos');
  protected readonly brandFilter = signal<string>(ALL_BRANDS);
  protected readonly categoryFilter = signal<string>(ALL_CATEGORIES);
  protected readonly expandedId = signal<string | null>(null);

  private readonly rawProducts = signal<Product[]>([]);

  /** Marcas distintas realmente presentes no catálogo — não é uma lista mantida à mão. */
  protected readonly brands = computed(() => {
    const set = new Set<string>();
    for (const product of this.rawProducts()) {
      if (product.marca) {
        set.add(product.marca);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /** Mesma lógica das marcas — categorias distintas já presentes nos produtos. */
  protected readonly categories = computed(() => {
    const set = new Set<string>();
    for (const product of this.rawProducts()) {
      if (product.categoria) {
        set.add(product.categoria);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  protected readonly brandOptions = computed<SelectOption[]>(() => [
    { label: 'Todas as marcas', value: ALL_BRANDS },
    ...this.brands().map((b) => ({ label: b, value: b })),
  ]);

  protected readonly categoryOptions = computed<SelectOption[]>(() => [
    { label: 'Todas as categorias', value: ALL_CATEGORIES },
    ...this.categories().map((c) => ({ label: c, value: c })),
  ]);

  protected readonly products = computed<ProductRow[]>(() =>
    this.rawProducts().map((product) => {
      const totalStock = product.variacoes.reduce((sum, v) => sum + v.estoqueVariacao, 0);
      const status: ProductRow['status'] = product.variacoes.some((v) => v.estoqueVariacao === 0)
        ? 'sem-estoque'
        : product.variacoes.some((v) => v.estoqueVariacao <= LOW_STOCK_THRESHOLD)
          ? 'baixo'
          : 'em-estoque';
      return { ...product, totalStock, status };
    })
  );

  protected readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const brand = this.brandFilter();
    const category = this.categoryFilter();

    return this.products().filter((product) => {
      const matchesTerm =
        !term || product.nome.toLowerCase().includes(term) || product.SKUPai.toLowerCase().includes(term);

      const matchesStatus =
        status === 'todos' ||
        (status === 'baixo' && product.status === 'baixo') ||
        (status === 'sem-estoque' && product.status === 'sem-estoque');

      const matchesBrand = brand === ALL_BRANDS || product.marca === brand;
      const matchesCategory = category === ALL_CATEGORIES || product.categoria === category;

      return matchesTerm && matchesStatus && matchesBrand && matchesCategory;
    });
  });

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.productsService.list().subscribe({
      next: (products) => {
        this.rawProducts.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar os produtos agora.');
        this.loading.set(false);
      },
    });
  }

  protected toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected readonly confirming = signal(false);
  protected readonly stockErrorId = signal<string | null>(null);

  // ---- Excluir produto ----
  protected readonly deleteTarget = signal<ProductRow | null>(null);

  protected requestDelete(product: ProductRow): void {
    this.deleteTarget.set(product);
  }

  protected deleteMessage(product: ProductRow): string {
    return `Excluir "${product.nome}" e todas as suas variações? Essa ação não pode ser desfeita.`;
  }

  protected confirmDelete(): void {
    const product = this.deleteTarget();
    if (!product) {
      return;
    }

    this.confirming.set(true);
    this.productsService.remove(product.id).subscribe({
      next: () => {
        this.confirming.set(false);
        this.deleteTarget.set(null);
        this.rawProducts.update((products) => products.filter((p) => p.id !== product.id));
      },
      error: () => {
        this.confirming.set(false);
        this.errorMessage.set('Não foi possível excluir o produto agora.');
      },
    });
  }

  // ---- Atualizar estoque, por modal (não mais input solto no card) ----
  protected readonly stockEditTarget = signal<StockEditTarget | null>(null);
  protected readonly stockEditValue = signal(0);

  protected openStockEdit(product: ProductRow, variacao: ProductVariation): void {
    this.stockEditTarget.set({ product, variacao });
    this.stockEditValue.set(variacao.estoqueVariacao);
  }

  protected closeStockEdit(): void {
    this.stockEditTarget.set(null);
  }

  protected confirmStockEdit(): void {
    const target = this.stockEditTarget();
    if (!target || this.stockEditValue() === target.variacao.estoqueVariacao) {
      return;
    }

    const newValue = this.stockEditValue();
    this.confirming.set(true);
    this.stockErrorId.set(null);

    const updatedVariacoes = target.product.variacoes.map((v) =>
      v.id === target.variacao.id ? { ...v, estoqueVariacao: newValue } : v
    );

    this.productsService.updateVariacaoStock(target.product.id, updatedVariacoes).subscribe({
      next: () => {
        this.confirming.set(false);
        this.stockEditTarget.set(null);
        this.rawProducts.update((products) =>
          products.map((p) => (p.id === target.product.id ? { ...p, variacoes: updatedVariacoes } : p))
        );
      },
      error: () => {
        this.confirming.set(false);
        this.stockEditTarget.set(null);
        this.stockErrorId.set(target.product.id);
      },
    });
  }
}