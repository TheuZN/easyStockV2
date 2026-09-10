import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { CadastroComponent } from './pages/cadastro.component';
import { ProdutosComponent } from './pages/produtos.component';
import { CadastroMarcaComponent } from './pages/cadastromarca.component';
import { CadastroCategoriaComponent } from './pages/cadastrocategoria.component';
import { LoginComponent } from './pages/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'produtos', component: ProdutosComponent, canActivate: [authGuard] },
  { path: 'cadastro', component: CadastroComponent, canActivate: [authGuard] },
  { path: 'marcas', component: CadastroMarcaComponent, canActivate: [authGuard] },
  { path: 'categorias', component: CadastroCategoriaComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];