import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink],
  template: `<main class="public">
    <a class="brand" routerLink="/">HR<span>Flow</span></a>
    <section class="auth-card"><router-outlet /></section>
    <p class="muted">Gestion RH simple, sûre et humaine.</p>
  </main>`,
})
export class PublicLayout {}
