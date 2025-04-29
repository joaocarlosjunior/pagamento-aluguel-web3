import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'main', loadComponent: () => import('./features/main/main.component').then(m => m.MainComponent) },
  { path: 'locatario', loadComponent: () => import('./features/locatario/locatario.component').then(m => m.LocatarioComponent) },
  { path: 'locador', loadComponent: () => import('./features/locador/locador.component').then(m => m.LocadorComponent) },
  { path: '**', redirectTo: 'home' }
];
