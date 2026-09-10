import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-svh items-center justify-center bg-ink-950 px-4">
      <div class="w-full max-w-sm">
        <div class="flex items-center justify-center gap-2.5">
          <span class="grid size-9 place-items-center rounded-lg bg-amber-500 text-base font-bold text-ink-950">E</span>
          <span class="font-display text-xl font-semibold text-paper">EasyStock</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 flex flex-col gap-4 rounded-2xl border border-ink-700/60 bg-surface/40 p-6">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80" for="email">E-mail</label>
            <input
              id="email"
              formControlName="email"
              type="email"
              autocomplete="username"
              class="w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-paper/80" for="password">Senha</label>
            <input
              id="password"
              formControlName="password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-xl border border-ink-700/60 bg-surface/40 px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>

          @if (errorMessage()) {
            <p class="text-sm text-rose-500">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="mt-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50"
          >
            {{ loading() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email ?? '', password ?? '').subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
        // Mensagem genérica de propósito — não revela se foi o e-mail ou a senha que errou.
        this.errorMessage.set('E-mail ou senha incorretos.');
      },
    });
  }
}