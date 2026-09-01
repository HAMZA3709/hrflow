# HRFlow Backend

Backend REST MVP de gestion RH construit avec Java 21, Spring Boot 3.5, PostgreSQL 17, JPA, Flyway, Spring Security/JWT, Mailpit, Actuator et OpenAPI.

## Architecture

Le code est organisé par fonctionnalité sous `com.hrflow.platform` : `auth`, `user`, `department`, `employee`, `leave`, `dashboard`, `email`, `security`, `config`, `exception` et `common`. Les contrôleurs exposent des DTO, les services portent les transactions et règles métier, et Flyway est l'unique source du schéma (`ddl-auto=validate`). Les dates techniques sont en UTC.

## Prérequis et démarrage

- JDK 21 (le build Maven cible strictement Java 21)
- Docker avec Compose

```bash
cp .env.example .env
# Remplacer DB_PASSWORD et JWT_SECRET dans .env
openssl rand -base64 48   # génération recommandée de JWT_SECRET
docker compose up -d
set -a; . ./.env; set +a
./mvnw spring-boot:run
```

Le fichier `.env` est ignoré par Git. En production, ne pas activer le profil `dev` et fournir obligatoirement `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `MAIL_HOST` et `MAIL_PORT`. L'administrateur initial n'est créé que si `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` (12 caractères minimum) sont fournis ; aucun mot de passe par défaut n'existe.

Services locaux : API `http://localhost:8080`, Swagger `http://localhost:8080/swagger-ui.html`, Mailpit `http://localhost:8025`, health `http://localhost:8080/actuator/health`. Les métriques détaillées et Prometheus requièrent un JWT ADMIN.

## API v1

- Auth : `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/verify-email`, `POST /api/v1/auth/resend-verification`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`, `GET /api/v1/auth/me`
- Utilisateurs ADMIN : liste, détail, modification du rôle et activation sous `/api/v1/users`
- Départements ADMIN/HR : création, liste, détail, mise à jour et activation sous `/api/v1/departments`
- Employés : CRUD logique, profil personnel et équipe sous `/api/v1/employees`
- Congés : création, demandes personnelles, filtres, approbation, rejet et annulation sous `/api/v1/leave-requests`
- Dashboard ADMIN/HR/MANAGER : `GET /api/v1/dashboard/summary`

Rôles : `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`. L'API utilise exclusivement `Authorization: Bearer <JWT>`, sans session. Une demande de congé ne peut chevaucher une demande pending/approved ; seul le manager direct (ou HR/ADMIN) décide ; le rejet exige un commentaire ; une annulation employé est limitée aux demandes futures en attente.

## Parcours curl

```bash
curl -X POST http://localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' -d '{"email":"employee@example.com","password":"ChangeMe!12345"}'
# Copier le token depuis le message visible dans Mailpit
curl 'http://localhost:8080/api/v1/auth/verify-email?token=TOKEN'
curl -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"employee@example.com","password":"ChangeMe!12345"}'
curl http://localhost:8080/api/v1/auth/me -H 'Authorization: Bearer ACCESS_TOKEN'
```

## Tests

```bash
./mvnw clean verify
```

Les tests Testcontainers utilisent PostgreSQL 17 et un vrai serveur Mailpit, jamais H2. Ils ne sont pas désactivés lorsque Docker est absent : le build échoue explicitement. Testcontainers 1.21.4 est requis pour les daemons Docker récents qui refusent l'ancienne négociation d'API 1.32.

## Dépannage

- `JWT_SECRET must contain at least 32 bytes` : générer une valeur avec `openssl rand -base64 48`.
- connexion PostgreSQL refusée : attendre `docker compose ps` healthy et vérifier `DB_URL`/identifiants.
- email absent : vérifier Mailpit, `MAIL_HOST=localhost`, `MAIL_PORT=1025`.
- erreur Flyway/Hibernate : ne pas modifier le schéma manuellement ; ajouter une nouvelle migration versionnée.
- port occupé : changer les ports Compose ou `SERVER_PORT`.
