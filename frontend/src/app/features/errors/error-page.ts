import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  template: `<main class="error-page">
    <a class="brand" routerLink="/">HR<span>Flow</span></a>
    <p class="eyebrow">Erreur {{ code }}</p>
    <h1>{{ code === '403' ? 'Accès interdit' : 'Page introuvable' }}</h1>
    <p class="muted">
      {{
        code === '403'
          ? 'Votre rôle ne permet pas d’accéder à cette page.'
          : 'Cette adresse ne correspond à aucune page.'
      }}
    </p>
    <a class="button" routerLink="/app">Retour à l’accueil</a>
  </main>`,
})
export class ErrorPage {
  code = inject(ActivatedRoute).snapshot.data['code'] as string;
}
