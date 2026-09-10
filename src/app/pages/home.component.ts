import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductsService } from '../services/product.service';

const LOW_STOCK_THRESHOLD = 5;

interface StatCard {
  label: string;
  value: number;
  accent: 'amber' | 'sage' | 'rose';
}

interface BrandStock {
  label: string;
  count: number;
}

interface LowStockRow {
  productName: string;
  sku: string;
  remaining: number;
}

interface RecentRow {
  name: string;
  brand: string;
  quantity: number;
  addedLabel: string;
}

const ACCENT_BAR: Record<StatCard['accent'], string> = {
  amber: 'bg-amber-500',
  sage: 'bg-sage-500',
  rose: 'bg-rose-500',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <div class="px-4 py-8 sm:px-8">
      <div>
        <h1 class="font-display text-2xl font-semibold text-paper">Olá, Mateus</h1>
        <p class="mt-1 text-sm text-paper/60">Aqui está o resumo do seu estoque hoje.</p>
      </div>

      @if (loading()) {
        <p class="mt-8 text-sm text-paper/60">Carregando…</p>
      } @else if (errorMessage()) {
        <p class="mt-8 text-sm text-rose-500">{{ errorMessage() }}</p>
      } @else {
        <!-- Cards de resumo -->
        <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          @for (stat of stats(); track stat.label) {
            <div class="flex items-center gap-4 rounded-2xl border border-ink-700/60 bg-surface/40 p-5">
              <span class="h-10 w-1 shrink-0 rounded-full" [class]="accentBar[stat.accent]"></span>
              <div>
                <p class="font-display text-3xl font-semibold text-paper">{{ stat.value }}</p>
                <p class="mt-0.5 text-sm text-paper/60">{{ stat.label }}</p>
              </div>
            </div>
          }
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <!-- Estoque por marca -->
          <div class="rounded-2xl border border-ink-700/60 bg-surface/40 p-6">
            <h2 class="font-display text-base font-semibold text-paper">Estoque por marca</h2>

            @if (brandStock().length === 0) {
              <p class="mt-4 text-sm text-paper/50">Nenhuma marca cadastrada nos produtos ainda.</p>
            } @else {
              <div class="mt-6 flex flex-col gap-4">
                @for (row of brandStock(); track row.label) {
                  <div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-paper/80">{{ row.label }}</span>
                      <span class="font-medium text-paper">{{ row.count }} un.</span>
                    </div>
                    <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700/60">
                      <div class="h-full rounded-full bg-amber-500" [style.width.%]="(row.count / maxBrandCount()) * 100"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Estoque baixo -->
          <div class="flex flex-col justify-between rounded-2xl bg-rose-500/15 p-6">
            <div>
              <h2 class="font-display text-base font-semibold text-paper">Estoque baixo!</h2>
              <p class="mt-1.5 text-sm text-paper/70">
                @if (lowStock().length === 0) {
                  Tudo certo — nenhum item precisando de reposição agora.
                } @else {
                  {{ lowStock().length }} itens estão prestes a acabar. Reabasteça antes que faltem.
                }
              </p>
            </div>

            @if (lowStock().length > 0) {
              <ul class="mt-5 flex flex-col gap-2.5">
                @for (item of lowStock(); track item.sku) {
                  <li class="flex items-center justify-between rounded-xl bg-surface/50 px-3.5 py-2.5 text-sm">
                    <span class="text-paper">{{ item.productName }} · {{ item.sku }}</span>
                    <span class="font-display font-semibold text-rose-500">{{ item.remaining }} un.</span>
                  </li>
                }
              </ul>
            }

            <a
              routerLink="/produtos"
              class="mt-5 inline-block self-start rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              Ver produtos
            </a>
          </div>
        </div>

        <!-- Adicionados recentemente -->
        <div class="mt-6 rounded-2xl border border-ink-700/60 bg-surface/40 p-6">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-base font-semibold text-paper">Adicionados recentemente</h2>
            <a routerLink="/produtos" class="text-sm font-medium text-amber-500 hover:underline">Ver todos</a>
          </div>

          @if (recent().length === 0) {
            <p class="mt-4 text-sm text-paper/50">Nenhum produto cadastrado ainda.</p>
          } @else {
            <div class="mt-5 flex flex-col divide-y divide-ink-700/60">
              @for (item of recent(); track item.name) {
                <div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <p class="text-sm font-medium text-paper">{{ item.name }}</p>
                    <p class="mt-0.5 text-xs text-paper/50">{{ item.brand }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-paper">{{ item.quantity }} un.</p>
                    <p class="mt-0.5 text-xs text-paper/50">{{ item.addedLabel }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  private readonly productsService = inject(ProductsService);

  protected readonly accentBar = ACCENT_BAR;
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly products = signal<Product[]>([]);

  constructor() {
    this.productsService.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar o painel agora.');
        this.loading.set(false);
      },
    });
  }

  /** "Item" aqui é cada variação — é o nível em que estoque de verdade existe. */
  protected readonly stats = computed<StatCard[]>(() => {
    const allVariacoes = this.products().flatMap((p) => p.variacoes);
    const outOfStock = allVariacoes.filter((v) => v.estoqueVariacao === 0).length;
    const healthy = allVariacoes.filter((v) => v.estoqueVariacao > LOW_STOCK_THRESHOLD).length;

    return [
      { label: 'Produtos cadastrados', value: this.products().length, accent: 'amber' },
      { label: 'Itens em falta', value: outOfStock, accent: 'rose' },
      { label: 'Itens com estoque saudável', value: healthy, accent: 'sage' },
    ];
  });

  protected readonly brandStock = computed<BrandStock[]>(() => {
    const totals = new Map<string, number>();
    for (const product of this.products()) {
      if (!product.marca) {
        continue;
      }
      const stock = product.variacoes.reduce((sum, v) => sum + v.estoqueVariacao, 0);
      totals.set(product.marca, (totals.get(product.marca) ?? 0) + stock);
    }
    return Array.from(totals, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  });

  protected readonly maxBrandCount = computed(() => Math.max(1, ...this.brandStock().map((b) => b.count)));

  protected readonly lowStock = computed<LowStockRow[]>(() => {
    const rows: LowStockRow[] = [];
    for (const product of this.products()) {
      for (const variacao of product.variacoes) {
        if (variacao.estoqueVariacao <= LOW_STOCK_THRESHOLD) {
          rows.push({ productName: product.nome, sku: variacao.SKUFilho, remaining: variacao.estoqueVariacao });
        }
      }
    }
    return rows.sort((a, b) => a.remaining - b.remaining).slice(0, 5);
  });

  protected readonly recent = computed<RecentRow[]>(() => {
    const sorted = [...this.products()].sort((a, b) => {
      const aTime = a.criadoEm?.toMillis() ?? 0;
      const bTime = b.criadoEm?.toMillis() ?? 0;
      return bTime - aTime;
    });

    return sorted.slice(0, 5).map((product) => ({
      name: product.nome,
      brand: product.marca ?? 'Sem marca',
      quantity: product.variacoes.reduce((sum, v) => sum + v.estoqueVariacao, 0),
      addedLabel: product.criadoEm ? product.criadoEm.toDate().toLocaleDateString('pt-BR') : '—',
    }));
  });
}