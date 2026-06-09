# Yoto Control Center — Guide développeur

## Prérequis
- Node.js 20+
- npm 10+

## Installation

```bash
git clone ...
cd yoto-control-center
npm install
```

## Configuration

Copie `.env.local.example` vers `.env.local` :

```bash
cp .env.local.example .env.local
```

Variables obligatoires :
| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | SQLite path | `file:./dev.db` |
| `ENABLE_MOCK_PROVIDER` | Mode simulation | `true` |
| `APP_TIMEZONE` | Timezone scheduler | `America/Montreal` |
| `YOTO_REFRESH_TOKEN` | Token Yoto (si mock=false) | — |
| `YOTO_ACCESS_TOKEN` | Token Yoto (si mock=false) | — |

## Base de données

```bash
# Créer la DB et appliquer les migrations
npx prisma migrate deploy

# Peupler avec les données de démo
npx prisma db seed
```

## Développement

```bash
npm run dev        # Démarre le serveur (port 3000)
npm test           # Lance les tests unitaires
npm run build      # Build production
```

## Architecture

```
src/
├── app/              Next.js App Router (routes + pages)
├── components/       Composants React réutilisables
├── lib/              Logique partagée (types, providers, utils)
│   ├── yoto/         Interface YotoProvider + Mock/Real implementations
│   ├── events/       Event bus interne
│   ├── scenarios/    Types scénarios
│   └── scheduler/    Types scheduler
├── server/services/  Services Node.js (EventService, ScenarioRunner, etc.)
├── hooks/            React hooks client
└── domain/           Entités et types métier
```

## Services au démarrage

L'instrumentation Next.js (`src/instrumentation.ts`) démarre automatiquement :
1. `EventService` — écoute les événements MQTT et les persiste en DB
2. `SchedulerService` — charge et active les routines planifiées

## Mode simulation (ENABLE_MOCK_PROVIDER=true)

En mode simulation :
- `MockYotoProvider` simule 2 devices (player + mini)
- Des événements MQTT fictifs sont émis toutes les 5s
- Aucun device Yoto réel n'est nécessaire

## Connecter un vrai Yoto

1. Obtenir un `REFRESH_TOKEN` depuis l'app Yoto (voir docs/research-notes.md)
2. Mettre `ENABLE_MOCK_PROVIDER=false` dans `.env.local`
3. Renseigner `YOTO_REFRESH_TOKEN` et `YOTO_ACCESS_TOKEN`
4. Redémarrer le serveur
