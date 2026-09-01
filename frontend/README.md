# HRFlow Frontend

Application RH responsive Angular 22, TypeScript 6 strict et composants standalone. Les fonctionnalités sont chargées à la demande sous `features/`; `core/` contient l’authentification, les modèles exacts de l’API, les guards, interceptors, layouts et services; `shared/` est réservé aux éléments transverses réutilisables.

## Prérequis et démarrage

- Node.js 22 et npm 10
- Backend HRFlow sur `http://localhost:8080`

```bash
# à la racine : PostgreSQL + Mailpit, puis backend
cp .env.example .env
docker compose up -d
set -a; . ./.env; set +a
./mvnw spring-boot:run

# dans frontend/ : installation et serveur avec proxy API
npm ci
npm start
```

Ouvrir `http://localhost:4200`. Le proxy de développement transfère `/api` et `/actuator` au backend. `environment.ts` utilise `/api/v1`; aucune clé ni aucun secret n’est embarqué.

## Fonctionnalités et rôles

- Authentification : connexion, inscription, vérification et renvoi d’email, oubli/réinitialisation du mot de passe, déconnexion.
- ADMIN : dashboard, utilisateurs, départements, employés, congés, profil.
- HR : dashboard, départements, employés, congés, profil.
- MANAGER : dashboard, équipe, demandes à traiter, profil.
- EMPLOYEE : demandes personnelles et profil. Le backend actuel n’autorise pas le dashboard pour ce rôle.

Les pages couvrent chargement, absence de données, erreurs, confirmations et retours de succès. Les formulaires et filtres consomment exclusivement les routes Spring Boot réelles. La pagination utilise l’enveloppe stable Spring Data (`content` et `page` avec `number`, `size`, `totalElements`, `totalPages`), activée côté backend avec `VIA_DTO`.

## Sécurité

Le backend fournit uniquement un Bearer JWT, pas de cookie HttpOnly. HRFlow conserve donc le token dans `sessionStorage`, derrière `TokenService`, et le supprime à la déconnexion ou lors d’un 401. Cette stratégie limite la persistance mais reste exposée à une XSS : une évolution backend vers un cookie HttpOnly `Secure`/`SameSite` serait préférable. L’interceptor refuse d’envoyer le JWT vers une origine externe. Les rôles filtrent l’interface, tandis que Spring Security reste l’autorité finale.

Chaque requête porte `X-Correlation-ID`. Les erreurs `code`, `message`, `fieldErrors`, `status` et l’en-tête de corrélation sont normalisés; aucune stack trace n’est affichée.

## Commandes qualité

```bash
npm run lint
npm run format:check
npm test -- --watch=false
npm run build
npm run e2e
```

Les tests unitaires utilisent Vitest et les outils HTTP Angular. Playwright exécute les parcours réels sur Chromium desktop et mobile et AXE contrôle les violations d’accessibilité. L’E2E attend le backend sur le port 8080, Mailpit sur 8025 et démarre Angular sur le port contrôlé 4300. Les identifiants du compte de validation peuvent être remplacés avec `E2E_ADMIN_EMAIL` et `E2E_ADMIN_PASSWORD`.

## Routes principales

Routes publiques : `/connexion`, `/inscription`, `/verifier-email?token=…`, `/renvoyer-verification`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe?token=…`. Les alias `/verify-email` et `/reset-password` garantissent la compatibilité avec les liens produits par le backend.

Routes privées : `/app/dashboard`, `/app/utilisateurs`, `/app/departements`, `/app/employes`, `/app/conges`, `/app/profil`, plus `/403` et la page 404.
