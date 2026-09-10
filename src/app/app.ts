import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar.component';
import { TopbarComponent } from './components/topbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly authService = inject(AuthService);

  protected readonly showShell = signal(false);

  constructor() {
    this.authService.user$.subscribe((user) => this.showShell.set(!!user));
  }
}