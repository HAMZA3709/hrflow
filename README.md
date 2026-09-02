# HRFlow Backend

[![CI](https://github.com/HAMZA3709/hrflow/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/HAMZA3709/hrflow/actions/workflows/ci.yml)

Plateforme RH avec module Recrutement V2, construite avec Java 21, Spring Boot 3.5, Angular standalone, PostgreSQL 17, Flyway, JWT, Mailpit, Actuator et OpenAPI.

## Architecture

Le code est organisé par fonctionnalité sous `com.hrflow.platform`, dont `recruitment`. Les contrôleurs exposent uniquement des DTO, les services portent transactions et règles métier, et Flyway est l'unique source du schéma (`ddl-auto=validate`). Les dates techniques sont en UTC. La migration V3 ajoute offres, candidats, candidatures, entretiens, évaluations, métadonnées CV et audit.

### Workflow recrutement

Une offre passe de `DRAFT` à `PUBLISHED`, puis `CLOSED` ou `CANCELLED`. Le pipeline contrôlé suit `APPLIED → SCREENING → INTERVIEW/TECHNICAL_TEST → HR_INTERVIEW → OFFER → HIRED`; `REJECTED` (avec motif) et `WITHDRAWN` sont terminaux. Une embauche exige une étape `OFFER`, un entretien finalisé et une évaluation `HIRE` ou `STRONG_HIRE`. La conversion crée ou réutilise sans doublon le compte et l’employé dans la même transaction. Elle est idempotente. Après une embauche, l’offre est automatiquement clôturée lorsqu’elle n’a plus aucune candidature active ; elle peut sinon être clôturée manuellement.

Permissions : ADMIN et HR gèrent tout ; MANAGER ne voit que ses offres et candidatures et agit sur leurs entretiens ; EMPLOYEE ne voit que les entretiens auxquels il participe et peut les finaliser/évaluer. Les seuls endpoints anonymes sont la liste des offres publiées et la création explicite d’un candidat/candidature sous `/api/v1/recruitment/public`.

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
- Recrutement : CRUD et actions sous `/api/v1/recruitment/{offers,candidates,applications,interviews,evaluations}`, CV sous `/candidates/{id}/cv`, statistiques sous `/dashboard`
- Portail candidat : `GET /api/v1/recruitment/public/offers`, `POST /public/candidates`, `POST /public/applications`

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

## Stockage des CV

Les CV sont limités au PDF et à `CV_MAX_SIZE` octets (5 Mio par défaut). Leur signature `%PDF-` est contrôlée, le nom serveur est un UUID, le SHA-256 est conservé et le chemin interne n’est jamais exposé. `CV_STORAGE_DIRECTORY` doit pointer vers un volume local hors dépôt (par défaut `/tmp/hrflow-cv`) et être sauvegardé séparément en production. Le nom d’origine sert uniquement à l’en-tête de téléchargement. Limitation V2 : pas de stockage objet ni d’antivirus asynchrone. `CvStorageService` constitue le point d’extension prévu pour brancher un scanner antivirus avant l’écriture et remplacer le stockage local par un adaptateur objet.

Les pages Angular lazy-loaded sont disponibles sous `/app/recrutement` : dashboard, listes/détails/édition des offres, candidats et CV, candidatures avec audit, Kanban clavier, entretiens et évaluations. Tous les écrans consomment l’API réelle.

Les timers Micrometer `hrflow.recruitment.application.{create,transition,hire,reject}.duration`, `hrflow.recruitment.interview.schedule.duration` et `hrflow.recruitment.cv.upload.duration` mesurent les opérations importantes sans tag ni donnée personnelle. L’environnement cible reste strictement JDK 21 (`maven.compiler.release=21`) ; une JVM locale plus récente peut exécuter les validations sans changer le bytecode cible.

## Intégration continue

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) s’exécute à chaque push et pull request vers `main`, ainsi que manuellement depuis l’onglet Actions. Deux jobs indépendants permettent d’identifier rapidement la pile en échec :

- **Backend · Java 21 / Maven** utilise Temurin 21, le cache Maven et Docker réel pour exécuter `./mvnw clean verify`, y compris PostgreSQL et Mailpit Testcontainers. Les rapports Surefire sont archivés pendant 7 jours en cas d’échec.
- **Frontend · Node 22 / Angular** utilise Node 22, le cache npm fondé sur `frontend/package-lock.json`, puis exécute installation reproductible, lint TypeScript strict, tests sans watch et build de production. Les diagnostics disponibles sont archivés en cas d’échec.

Les permissions GitHub sont limitées à `contents: read`. Aucun secret réel ni fichier `.env` n’est lu par la CI. Les deux jobs échouent immédiatement si Git suit accidentellement un `.env` réel ; seul `.env.example` est autorisé. Les anciennes exécutions d’une même branche sont annulées par la règle de concurrence.

Commandes locales équivalentes :

```bash
# Backend — Docker doit être disponible pour Testcontainers
./mvnw clean verify

# Frontend
cd frontend
npm ci
npm run lint
npm test -- --watch=false
npm run build
```

En cas d’échec, ouvrir le job concerné dans GitHub Actions, consulter la première commande en erreur, puis télécharger l’artefact `backend-surefire-reports` ou `frontend-diagnostics` lorsqu’il est présent. Reproduire ensuite la commande équivalente localement avec Java 21 ou Node 22 avant de pousser la correction. Ne pas contourner un échec en désactivant un test.

## Dépannage

- `JWT_SECRET must contain at least 32 bytes` : générer une valeur avec `openssl rand -base64 48`.
- connexion PostgreSQL refusée : attendre `docker compose ps` healthy et vérifier `DB_URL`/identifiants.
- email absent : vérifier Mailpit, `MAIL_HOST=localhost`, `MAIL_PORT=1025`.
- erreur Flyway/Hibernate : ne pas modifier le schéma manuellement ; ajouter une nouvelle migration versionnée.
- port occupé : changer les ports Compose ou `SERVER_PORT`.
