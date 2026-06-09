# Yoto Control Center — Documentation des fonctionnalités

> Cockpit parental pour contrôler un player Yoto depuis un navigateur (desktop ou mobile).

---

## Table des matières

1. [Démarrage rapide](#1-démarrage-rapide)
2. [Dashboard](#2-dashboard)
3. [Devices — contrôle des players](#3-devices--contrôle-des-players)
4. [Scénarios](#4-scénarios)
5. [Planning (Scheduler)](#5-planning-scheduler)
6. [Icônes 16×16](#6-icônes-1616)
7. [Logs](#7-logs)
8. [API REST](#8-api-rest)
9. [Mode simulation vs mode réel](#9-mode-simulation-vs-mode-réel)

---

## 1. Démarrage rapide

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.local.example .env.local

# Initialiser la base de données + données de démo
npx prisma migrate deploy
npx prisma db seed

# Lancer le serveur
npm run dev
```

Ouvrir `http://localhost:3000` — le dashboard s'affiche avec le mode simulation activé par défaut.

---

## 2. Dashboard

**Page principale** (`/`)

Le dashboard donne une vue d'ensemble en temps réel :

| Bloc | Contenu |
|---|---|
| **Flux d'événements** | Les 20 derniers événements MQTT du player (se rafraîchit toutes les 5s) |
| **État du système** | Mode actif (simulation ou réel), statut du serveur |

### Badge de mode

En haut à droite de toutes les pages :
- 🟡 **"Mode simulation"** — aucun device Yoto réel connecté, tout est fictif
- 🟢 (rien) — mode réel connecté

---

## 3. Devices — contrôle des players

**Page** : `/devices`

### Ce qu'on voit

Chaque card de device affiche :
- Nom du player (ex: "Yoto de Sofia")
- Type : **Player** ou **Mini**
- Statut : **En ligne** / **Hors ligne** (badge coloré)
- Niveau de batterie
- Volume actuel (0–100%)
- Contenu en cours de lecture (titre, statut idle/playing/paused)

### Contrôles disponibles

**PlayerControls** (bas de chaque card) :
| Bouton | Action |
|---|---|
| ▶ Play / Resume | Reprend la lecture si en pause |
| ⏸ Pause | Met en pause la lecture en cours |
| 🔊 Volume + | Augmente le volume de 10% |
| 🔊 Volume − | Diminue le volume de 10% |

> Les boutons Pause et Resume sont désactivés automatiquement si l'état ne le permet pas.

**PlaylistLauncher** (sous chaque card) :
- Sélectionner le type : **Playlist** ou **Stream**
- Saisir l'ID de playlist ou l'URL du stream
- Cliquer **Lancer**

### Gestion des erreurs

- Si le provider est mal configuré → message d'erreur rouge distinct de "aucun device"
- Un device introuvable → 404 explicite
- Volume hors-limites → rejeté par validation avant envoi

---

## 4. Scénarios

**Page** : `/scenarios`

Un scénario est une **séquence d'actions** qui s'exécutent dans l'ordre sur un device.

### Scénarios prédéfinis (seedés en base)

#### 🎉 Super Papa Mode
Lance une séquence "wahou" pour impressionner l'enfant :
1. Règle le volume à 60%
2. Joue un message vocal personnalisé
3. Attend 2 secondes
4. Lance une playlist favorite
5. Envoie une notification parent

#### 🕵️ Mission Secrète
Crée une ambiance mystérieuse :
1. Volume à 70%
2. Message d'introduction dramatique
3. Attente 1 seconde
4. Lance la playlist "aventure"
5. Attente 5 secondes
6. Notification parent à la fin

#### 🌙 Routine Dodo
Prépare l'enfant au sommeil :
1. Volume baissé à 30%
2. Lance une histoire du soir
3. Attente 10 secondes
4. Enchaîne du bruit blanc
5. Active le mode nuit (si supporté)
6. Notification parent

### Types de steps disponibles

| Type | Description |
|---|---|
| `set_volume` | Règle le volume (0–100%) |
| `play_playlist` | Lance une playlist par son ID |
| `play_stream` | Lance un stream audio par URL |
| `wait` | Pause N secondes avant le step suivant |
| `assign_icon` | Change l'icône affichée |
| `notify_parent` | Log une notification dans les événements |

### Exécuter un scénario

1. Choisir le device dans le sélecteur de la card
2. Cliquer **Exécuter**
3. Toast de confirmation → le scénario tourne en fond
4. L'historique des runs est enregistré en base

### Créer un scénario

Via `POST /api/scenarios` avec un JSON de steps. Interface UI à venir (v1.5).

### Historique

Chaque exécution enregistre :
- Status : `running` / `completed` / `failed`
- Log step-by-step (quel step a réussi ou échoué)
- Date de début et de fin

---

## 5. Planning (Scheduler)

**Page** : `/scheduling`

Planifie l'exécution automatique de scénarios à des horaires définis.

### Schedule de démo (seedé)

**Routine Dodo — tous les soirs à 20h30** (heure de Montréal)
- Cron : `30 20 * * *`
- Device : mock-player-1
- Scénario : Routine Dodo

### Créer une planification

**CreateScheduleForm** :
1. Choisir un **scénario** dans la liste
2. Choisir le **device** cible
3. Saisir une **expression cron** (ex: `0 8 * * 1-5` = 8h du lundi au vendredi)
4. Choisir le **fuseau horaire** (America/Montreal, Europe/Paris, UTC)
5. Cliquer **Créer**

> L'expression cron est validée avant envoi. 5 champs obligatoires : `minute heure jour mois jour-semaine`.

### Actions sur un schedule

| Bouton | Action |
|---|---|
| **Run maintenant** | Exécute le scénario immédiatement, hors planning |
| **Dry run** | Simule l'exécution sans rien déclencher sur le player |
| **Activer / Désactiver** | Toggle sans supprimer la règle |
| **Supprimer** | Supprime le schedule et l'arrête |

### Robustesse

- Les schedules actifs sont chargés au démarrage du serveur
- Un schedule ajouté via l'UI est activé immédiatement (pas besoin de redémarrer)
- Verrou simple anti-double exécution via `lastRunAt`

---

## 6. Icônes 16×16

**Page** : `/icons`

Le Yoto peut afficher de petites icônes 16×16 pixels. Cette section permet de les gérer.

### Galerie d'icônes

- **Recherche** : tape un mot-clé (étoile, musique, dragon…)
- **Résultats** : grille d'aperçus colorés (PixelPreview)
- **Sélection** : clic sur une icône pour la sélectionner

Les 352 icônes publiques Yoto sont récupérées depuis l'API Yoto (avec fallback sur 12 icônes mock si l'API est inaccessible).

### Suggérer automatiquement une icône

`GET /api/icons/suggest?title=histoire+du+soir`

Le service extrait les mots-clés du titre, filtre les stop-words français et anglais, et tente un matching avec les icônes disponibles.

### Assigner une icône

**IconAssigner** (visible sur chaque ScenarioCard) :
1. Cliquer **Changer**
2. Parcourir la galerie ou utiliser **Suggestion auto**
3. Cliquer **Assigner**
4. L'assignation est sauvegardée en base

Chaque assignation mémorise :
- Type de source : `track`, `playlist`, ou `scenario`
- ID de la source
- Clé de l'icône
- Mode : `manual` ou `auto`

### Aperçu

Le composant **PixelPreview** rend chaque icône comme un carré coloré 16×16 avec la première lettre de la clé — rendu `pixelated` pour simuler le look pixel art.

---

## 7. Logs

**Page** : `/logs`

Affiche l'historique complet des événements du système.

### Types d'événements

| Événement | Couleur | Déclencheur |
|---|---|---|
| `device.connected` | 🟢 vert | Player vient de se connecter |
| `device.disconnected` | 🔴 rouge | Player déconnecté |
| `playback.started` | 🔵 bleu | Lecture démarrée |
| `playback.paused` | 🟡 jaune | Lecture mise en pause |
| `playback.finished` | ⚫ gris | Contenu terminé |
| `playback.track_changed` | 🟣 violet | Changement de piste |
| `volume.changed` | 🟠 orange | Volume modifié |
| `scenario.started` | 🔷 indigo | Scénario lancé |
| `scenario.failed` | 🔴 rouge | Scénario en erreur |
| `schedule.triggered` | (défaut) | Planning déclenché |

### Rafraîchissement

Le flux se met à jour automatiquement toutes les **5 secondes** sans rechargement de page.

### Persistance

Tous les événements sont stockés en base SQLite (table `event_logs`) avec :
- Type d'événement
- Device concerné
- Payload JSON complet
- Timestamp

---

## 8. API REST

Toutes les routes sont accessibles sous `http://localhost:3000/api/`.

### Santé

```
GET /api/health
→ { status, timestamp, env, mockMode, provider }
```

### Devices

```
GET  /api/devices                          → liste des devices
GET  /api/devices/:id                      → device par ID
GET  /api/devices/:id/playback             → état lecture
POST /api/devices/:id/play                 → { type: 'playlist'|'stream', id?, url? }
POST /api/devices/:id/pause                → pause
POST /api/devices/:id/resume               → reprise
POST /api/devices/:id/volume               → { volume: 0-100 }
```

### Scénarios

```
GET   /api/scenarios                       → liste
POST  /api/scenarios                       → créer { slug, name, description, steps }
GET   /api/scenarios/:id                   → détail
PATCH /api/scenarios/:id                   → modifier
POST  /api/scenarios/:id/run               → { deviceId }
GET   /api/scenarios/:id/runs              → historique des 50 derniers runs
```

### Planning

```
GET    /api/schedules                      → liste (avec statut actif)
POST   /api/schedules                      → { scenarioId, cron, timezone, deviceId }
GET    /api/schedules/:id                  → détail
PATCH  /api/schedules/:id                  → modifier (enabled, cron, timezone)
DELETE /api/schedules/:id                  → supprimer
POST   /api/schedules/:id/run              → { dryRun?: boolean }
```

### Icônes

```
GET  /api/icons/search?q=dragon&limit=20   → recherche
GET  /api/icons/suggest?title=dodo         → suggestion par titre
POST /api/icons/assign                     → { sourceType, sourceId, iconKey, mode? }
GET  /api/icons/:sourceType/:sourceId      → assignation existante
```

### Événements

```
GET /api/events?limit=50&deviceId=X        → historique des événements
```

---

## 9. Mode simulation vs mode réel

### Mode simulation (défaut)

```env
ENABLE_MOCK_PROVIDER=true
```

- 2 devices fictifs : **"Yoto de Sofia"** (Player) et **"Yoto Mini Chambre"** (Mini)
- Événements MQTT simulés toutes les **5 secondes** (track_changed, volume_changed)
- Volume et état de lecture mis à jour en mémoire
- Aucun device physique nécessaire
- Idéal pour développer l'UI et tester les scénarios

### Mode réel

```env
ENABLE_MOCK_PROVIDER=false
YOTO_REFRESH_TOKEN=ton_refresh_token
YOTO_ACCESS_TOKEN=ton_access_token
```

- Se connecte à l'API Yoto via `yoto-nodejs-client`
- Abonnement MQTT aux topics du player physique
- Les actions (play, pause, volume) sont envoyées au vrai device
- Le token se rafraîchit automatiquement

> Pour obtenir les tokens Yoto, voir `docs/research-notes.md` — section "Authentification".

---

## Données de démo incluses

Après `npx prisma db seed` :

| Type | Données |
|---|---|
| **Scénarios** | Super Papa Mode, Mission Secrète, Routine Dodo |
| **Schedule** | Routine Dodo à 20h30 (America/Montreal) |
| **Audio Assets** | Message bonjour, Bruit blanc (1h), Son Mission |

---

*Yoto Control Center — v1.0 · Next.js 16 · TypeScript · SQLite*
