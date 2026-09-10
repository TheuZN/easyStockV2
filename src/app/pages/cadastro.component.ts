import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../services/product.service';
import { BrandsService } from '../services/brands.service';
import { CategoriesService } from '../services/categories.service';
import { SelectDropdownComponent, SelectOption } from '../components/selectdropdown.component';
import { ConfirmDialogComponent } from '../components/confirmdialog.component';

const INPUT_CLASS =
  'w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, SelectDropdownComponent, ConfirmDialogComponent],
  template: `
    <div class="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <h1 class="font-display text-2xl font-semibold text-paper">Cadastro de produtos</h1>
      <p class="mt-1 text-sm text-paper/60">Cadastre um novo produto e suas variações.</p>

      @if (savedMessage()) {
        <div class="mt-6 rounded-xl bg-sage-500/15 px-4 py-3 text-sm text-paper">
          {{ savedMessage() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 flex flex-col gap-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80" for="skuPai">SKU pai</label>
            <input id="skuPai" formControlName="SKUPai" type="text" [class]="inputClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80" for="nome">Nome</label>
            <input id="nome" formControlName="nome" type="text" [class]="inputClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80">Marca</label>
            @if (brandOptions().length === 0 && !loadingBrands()) {
              <p class="text-sm text-paper/50">
                Nenhuma marca cadastrada ainda —
                <a routerLink="/marcas" class="text-amber-500 hover:underline">cadastre uma primeiro</a>.
              </p>
            } @else {
              <app-select-dropdown
                [options]="brandOptions()"
                [value]="form.controls.marca.value ?? ''"
                (valueChange)="form.controls.marca.setValue($event)"
                placeholder="Selecione a marca"
              />
            }
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80">Categoria</label>
            @if (categoryOptions().length === 0 && !loadingCategories()) {
              <p class="text-sm text-paper/50">
                Nenhuma categoria cadastrada ainda —
                <a routerLink="/categorias" class="text-amber-500 hover:underline">cadastre uma primeiro</a>.
              </p>
            } @else {
              <app-select-dropdown
                [options]="categoryOptions()"
                [value]="form.controls.categoria.value ?? ''"
                (valueChange)="form.controls.categoria.setValue($event)"
                placeholder="Selecione a categoria"
              />
            }
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="font-display text-base font-semibold text-paper">Variações</h2>
            <button
              type="button"
              (click)="onAddVariacao()"
              class="text-sm font-semibold text-amber-500 hover:underline"
            >
              + Adicionar variação
            </button>
          </div>

          @if (showVariationError()) {
            <p class="mt-2 text-sm text-rose-500">Adicione pelo menos uma variação antes de cadastrar.</p>
          }

          <div class="mt-4 flex flex-col gap-4" formArrayName="variacoes">
            @for (variacao of variacoes.controls; track variacao; let i = $index) {
              <div [formGroupName]="i" class="rounded-2xl border border-ink-700/60 bg-surface/40 p-5">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-paper/70">Variação {{ i + 1 }}</p>
                  <button
                    type="button"
                    (click)="onRemoveVariacao(i)"
                    aria-label="Remover variação"
                    class="grid size-7 place-items-center rounded-full text-paper/50 transition-colors hover:bg-ink-700/60 hover:text-paper"
                  >
                    <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </button>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-paper/60">SKU filho</label>
                    <input formControlName="SKUFilho" type="text" [class]="inputClass" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-paper/60">Tamanho</label>
                    <input formControlName="tamanhoVariacao" type="text" [class]="inputClass" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-paper/60">Cor</label>
                    <input formControlName="corVariacao" type="text" [class]="inputClass" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-paper/60">Estoque atual</label>
                    <input formControlName="estoqueVariacao" type="number" min="0" [class]="inputClass" />
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        @if (errorMessage()) {
          <p class="text-sm text-rose-500">{{ errorMessage() }}</p>
        }

        <button
          type="submit"
          [disabled]="checkingDuplicate()"
          class="self-start rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50"
        >
          {{ checkingDuplicate() ? 'Verificando…' : 'Cadastrar' }}
        </button>
      </form>
    </div>

    @if (pendingConfirm()) {
      <app-confirm-dialog
        title="Confirmar cadastro"
        [message]="confirmMessage()"
        confirmLabel="Cadastrar"
        [confirming]="saving()"
        (confirm)="confirmRegister()"
        (cancel)="pendingConfirm.set(false)"
      />
    }
  `,
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly brandsService = inject(BrandsService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly checkingDuplicate = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly savedMessage = signal<string | null>(null);
  protected readonly showVariationError = signal(false);
  protected readonly pendingConfirm = signal(false);

  protected readonly confirmMessage = computed(() => {
    const nome = this.form.controls.nome.value || '(sem nome)';
    return `Cadastrar "${nome}" com ${this.variacoes.length} variação(ões)?`;
  });

  protected readonly loadingBrands = signal(true);
  protected readonly brandOptions = signal<SelectOption[]>([]);
  protected readonly loadingCategories = signal(true);
  protected readonly categoryOptions = signal<SelectOption[]>([]);

  protected readonly form = this.fb.group({
    SKUPai: ['', [Validators.required]],
    nome: ['', [Validators.required]],
    marca: ['', [Validators.required]],
    categoria: ['', [Validators.required]],
    variacoes: this.fb.array([this.buildVariacao()]),
  });

  constructor() {
    this.form.controls.SKUPai.valueChanges.subscribe((value) => {
      this.form.controls.SKUPai.setValue((value ?? '').toUpperCase(), { emitEvent: false });
    });

    this.brandsService.list().subscribe({
      next: (brands) => {
        this.brandOptions.set(brands.map((b) => ({ label: b.nome, value: b.nome })));
        this.loadingBrands.set(false);
      },
      error: () => this.loadingBrands.set(false),
    });

    this.categoriesService.list().subscribe({
      next: (categories) => {
        this.categoryOptions.set(categories.map((c) => ({ label: c.nome, value: c.nome })));
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  get variacoes(): FormArray {
    return this.form.controls.variacoes;
  }

  private buildVariacao() {
    return this.fb.group({
      SKUFilho: ['', [Validators.required]],
      tamanhoVariacao: ['', [Validators.required]],
      corVariacao: ['', [Validators.required]],
      estoqueVariacao: [0, [Validators.required, Validators.min(0)]],
      // crypto.randomUUID() — nativo, sem depender de Math.random() pra unicidade.
      id: [crypto.randomUUID()],
    });
  }

  protected onAddVariacao(): void {
    this.variacoes.push(this.buildVariacao());
  }

  protected onRemoveVariacao(index: number): void {
    if (this.variacoes.length === 1) {
      return;
    }
    this.variacoes.removeAt(index);
  }

  /** Valida e checa duplicidade — só abre o modal de confirmação se os dois passarem. */
  protected onSubmit(): void {
    this.errorMessage.set(null);
    this.savedMessage.set(null);
    this.showVariationError.set(false);

    // FormArray.length > 0 checado à parte — Validators.required num array vazio nunca falha
    // (um array [] é "truthy" em JS), então não dava pra confiar só no form.valid pra isso.
    if (this.variacoes.length === 0) {
      this.showVariationError.set(true);
      return;
    }

    if (this.form.invalid) {
      this.errorMessage.set('Verifique se todos os campos foram preenchidos corretamente.');
      return;
    }

    const value = this.form.getRawValue();
    const skuPai = value.SKUPai ?? '';
    const skusFilho = value.variacoes.map((v) => v.SKUFilho ?? '');

    // Checagem local primeiro: duas variações do MESMO cadastro não podem repetir
    // SKU nem tamanho entre si — isso o checkDuplicateSku não pega, porque ele só
    // compara contra produtos que já existem no Firestore, não contra o array atual.
    const internalDuplicate = this.findInternalDuplicate(value.variacoes);
    if (internalDuplicate) {
      this.errorMessage.set(internalDuplicate);
      return;
    }

    this.checkingDuplicate.set(true);

    // Trava de duplicidade: SKU pai e cada SKU filho precisam ser únicos em todo o catálogo,
    // não só dentro do produto sendo cadastrado agora.
    this.productsService.checkDuplicateSku(skuPai, skusFilho).subscribe({
      next: (result) => {
        this.checkingDuplicate.set(false);
        if (result.hasDuplicate) {
          this.errorMessage.set(
            `O SKU "${result.duplicateSku}" já está em uso no produto "${result.existingProductName}".`
          );
          return;
        }
        this.pendingConfirm.set(true);
      },
      error: () => {
        this.checkingDuplicate.set(false);
        this.errorMessage.set('Não foi possível verificar SKUs duplicados agora. Tente novamente.');
      },
    });
  }

  /**
   * Dentro de UM MESMO produto: SKU precisa ser único entre as variações.
   * Tamanho e cor, sozinhos, podem repetir — o que não pode repetir é a
   * combinação dos dois (ex: dois "M Preto" no mesmo produto é inválido,
   * mas "M Preto" + "M Branco" é válido).
   */
  private findInternalDuplicate(
    variacoes: { SKUFilho: string | null; tamanhoVariacao: string | null; corVariacao: string | null }[]
  ): string | null {
    const seenSkus = new Set<string>();
    const seenCombos = new Set<string>();

    for (const variacao of variacoes) {
      const sku = (variacao.SKUFilho ?? '').trim().toUpperCase();
      const tamanho = (variacao.tamanhoVariacao ?? '').trim().toUpperCase();
      const cor = (variacao.corVariacao ?? '').trim().toUpperCase();
      const combo = `${tamanho}|${cor}`;

      if (seenSkus.has(sku)) {
        return `O SKU "${variacao.SKUFilho}" está repetido entre as variações deste produto.`;
      }
      if (seenCombos.has(combo)) {
        return `Já existe uma variação "${variacao.tamanhoVariacao} ${variacao.corVariacao}" neste produto.`;
      }

      seenSkus.add(sku);
      seenCombos.add(combo);
    }

    return null;
  }

  protected confirmRegister(): void {
    this.saving.set(true);
    const value = this.form.getRawValue();

    this.productsService.add(value as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingConfirm.set(false);
        this.savedMessage.set('Produto cadastrado com sucesso.');
        this.form.reset({ SKUPai: '', nome: '', marca: '', categoria: '' });
        this.variacoes.clear();
        this.variacoes.push(this.buildVariacao());
      },
      error: () => {
        this.saving.set(false);
        this.pendingConfirm.set(false);
        this.errorMessage.set('Erro ao cadastrar o produto. Tente novamente.');
      },
    });
  }
}