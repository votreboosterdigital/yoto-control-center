# Yoto Control Center — Research Notes

## Résumé exécutif

- L'API Yoto est **officiellement documentée** sur https://yoto.dev/ avec un vrai client ID OAuth — pas de reverse engineering nécessaire
- Le client Node.js `yoto-nodejs-client` (bcomnes) est la référence TypeScript la plus complète : HTTP REST + MQTT temps réel, types complets, published on npm
- Les commandes MQTT sont **la voie royale** pour le contrôle temps réel (volume, ambient, card play/pause/stop) — latence ~50ms
- Le format d'icône Yoto est un **pixel art 16x16** référencé par hash SHA-256 base64 (`yoto:#<hash>`) — un éditeur open-source (YoPix) et une librairie de 352 icônes publiques existent
- Le streaming de cartes MYO est **pull-based** : le player Yoto fait des GET HTTP vers votre serveur — il n'upload rien chez Yoto

---

## 1. yoto-nodejs-client (bcomnes)

Package npm : `yoto-nodejs-client`
Repo : https://github.com/bcomnes/yoto-nodejs-client
Branch par défaut : `master`

### Surface API disponible

**Classes principales :**
- `YotoClient` — Client HTTP bas niveau avec auto-refresh des tokens
- `YotoDeviceModel` — Client device stateful (HTTP + MQTT unifiés), émet des events TypeScript
- `YotoAccount` — Gestionnaire multi-device avec découverte automatique

**Endpoints REST confirmés :**

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/device-v2/devices/mine` | Liste des devices de l'utilisateur |
| GET | `/device-v2/{deviceId}/status` | Statut courant du device |
| GET | `/device-v2/{deviceId}/config` | Config complète (alarms, brightness, volume max...) |
| PUT | `/device-v2/{deviceId}/config` | Mise à jour config device |
| PUT | `/device-v2/{deviceId}/shortcuts` | Mise à jour shortcuts boutons (beta) |
| POST | `/device-v2/{deviceId}/command/status` | Envoi commande MQTT via REST |
| GET | `/media/displayIcons/user/yoto` | Icônes publiques Yoto |
| GET | `/media/displayIcons/user/{userId}` | Icônes custom de l'utilisateur |
| GET | `/content/cards` | Bibliothèque de cartes |
| GET | `/content/cards/{cardId}` | Contenu d'une carte (chapitres, tracks) |
| GET | `/myo` | Contenu MYO de l'utilisateur |

**Méthodes `YotoDeviceModel` (stateful) :**
- `deviceClient.start()` / `stop()` — démarre/arrête MQTT + polling HTTP
- `deviceClient.updateConfig(partialConfig)` — met à jour la config
- `deviceClient.sendCommand(mqttPayload)` — envoie une commande MQTT
- Propriétés en lecture : `deviceClient.status`, `.config`, `.playback`, `.capabilities`

**Events émis par `YotoDeviceModel` :**
- `statusUpdate` — batterie, volume, temperature, état online
- `configUpdate` — changement config device
- `playbackUpdate` — titre en cours, position, durée
- `online` / `offline` — avec metadata (reason: 'startup' | 'shutdown')

### Patterns d'authentification

- **Flow OAuth2 Device Code** (idéal CLI/serveur)
  1. `YotoClient.requestDeviceCode({ clientId })` → URL de vérification + user_code
  2. Utilisateur visite l'URL et autorise
  3. `YotoClient.waitForDeviceAuthorization({ deviceCode, clientId })` — bloque jusqu'à succès
- Client ID à obtenir sur https://yoto.dev/get-started/start-here/
- Scopes par défaut : `openid profile offline_access`
- Audience : `https://api.yotoplay.com`
- **Refresh token** géré automatiquement via `onTokenRefresh` callback — obligatoire pour persister les tokens
- Support PKCE (optionnel, `codeVerifier`)

### Communication MQTT

**Broker :** `wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com`  
**Port :** 443  
**Protocol :** WSS (WebSocket Secure)  
**Auth :** `PublicJWTAuthorizer` (JWT Yoto passé dans l'URL MQTT)  
**Keepalive :** 300 secondes  
**ALPN :** `x-amzn-mqtt-ca` (AWS IoT)

**Topics de souscription (par device) :**

| Topic | Type | Notes |
|---|---|---|
| `device/{id}/data/events` | events | Format documenté — état playback temps réel |
| `device/{id}/events` | events | Ancien format non documenté — mêmes données |
| `device/{id}/data/status` | status | Format documenté — répond à `requestStatus()` |
| `device/{id}/status` | status-legacy | REQUIS pour lifecycle events (startup/shutdown) |
| `device/{id}/response` | response | Réponse aux commandes |

**Topics de publication (commandes) :**

| Topic | Payload | Description |
|---|---|---|
| `device/{id}/command/volume/set` | `{ volume: 0-100 }` | Régler le volume |
| `device/{id}/command/ambients/set` | `{ r, g, b }` (0-255 chacun) | Couleur ambiante |
| `device/{id}/command/sleep-timer/set` | `{ seconds }` (0 = désactiver) | Timer extinction |
| `device/{id}/command/card/start` | `{ uri, chapterKey?, trackKey?, secondsIn?, cutOff?, anyButtonStop? }` | Lancer une carte |
| `device/{id}/command/card/stop` | `{}` | Arrêter la lecture |
| `device/{id}/command/card/pause` | `{}` | Mettre en pause |
| `device/{id}/command/card/resume` | `{}` | Reprendre la lecture |
| `device/{id}/command/bluetooth/on` | `{ action?, mode?, rssi?, name?, mac? }` | Activer Bluetooth |
| `device/{id}/command/bluetooth/off` | `{}` | Désactiver Bluetooth |
| `device/{id}/command/bluetooth/connect` | `{}` | Connecter appareil BT |
| `device/{id}/command/bluetooth/disconnect` | `{}` | Déconnecter BT |
| `device/{id}/command/bluetooth/delete-bonds` | `{}` | Supprimer liaisons BT |
| `device/{id}/command/bluetooth/state` | `{}` | État Bluetooth |
| `device/{id}/command/display/preview` | `{ uri, timeout, animated: 0\|1 }` | Prévisualiser une icône |
| `device/{id}/command/reboot` | `{}` | Redémarrer le device |
| `device/{id}/command/events/request` | `{}` | Demander état events |
| `device/{id}/command/status/request` | `{}` | Demander statut |

**Structure payload events (temps réel) :**
```json
{
  "repeatAll": false,
  "volume": 8,
  "volumeMax": 13,
  "cardId": "none",
  "playbackStatus": "stopped",
  "streaming": false,
  "playbackWait": false,
  "sleepTimerActive": false,
  "eventUtc": 1766515352
}
```
Note : `volume` = volume utilisateur (0-16 hardware), `volumeMax` = volume max système (0-16 hardware). Les API REST exposent en pourcentage 0-100.

**Structure payload status (legacy topic — lifecycle) :**
```json
{
  "status": {
    "shutDown": "nA",           // 'nA' = running, 'userShutdown' = éteint
    "upTime": 12,               // secondes depuis boot
    "utcTime": 0,               // 0 au démarrage avant sync NTP
    "batteryLevel": 100,
    "volume": 55,
    "userVolume": 50,
    "productType": "mini",
    "fwVersion": "v2.23.2",
    "activeCard": "none",
    "playingStatus": 0,
    "charging": 0,
    "powerSrc": 0               // 0=batterie, 1=dock V2, 2=USB-C, 3=Qi
  }
}
```

### Points d'attention

- Le topic legacy `device/{id}/status` (sans `/data/`) est **obligatoire** pour détecter startup/shutdown — il ne répond PAS à `requestStatus()`
- `data/status` répond aux requêtes, s'auto-publie toutes les 5 minutes
- Le topic `device/{id}/events` (ancien format) existe mais retourne des données hardware bas niveau — ne pas utiliser
- Les valeurs de volume dans les events MQTT sont sur une échelle hardware 0-16, converties en 0-100% par l'API REST
- `nightlightMode` : HTTP retourne 'off' ou '0x000000', MQTT retourne la vraie couleur hex ('0xff5733')
- `cardInsertionState` : 0=aucune, 1=physique, 2=remote (carte virtuelle)
- Aucune affiliation officielle avec Yoto Play

---

## 2. yoto_api (cdnninja — Python)

Repo : https://github.com/cdnninja/yoto_api  
Usage principal : intégration Home Assistant

### Capacités confirmées

**Gestion players :**
- `update_player_list()` → GET `/devices/mine`
- `update_player_info(device_id)` → config device
- `update_player_extended_status(device_id)` → télémétrie riche
- `refresh()` → mise à jour complète de tous les players

**Bibliothèque :**
- `update_library()` → parcourt les cartes
- `update_groups()` → groupes de cartes définis par l'utilisateur

**Contrôles playback (MQTT) :**
- `play_card()`, `pause()`, `resume()`, `stop()`
- `set_volume()` (0-100)
- `next_track()`, `previous_track()`, `seek()`
- Latence réponse : ~50ms

**Configuration device (REST PUT) :**
- `set_player_config()` — day/night settings, luminosité, ambient color
- `set_alarms()`, `set_alarm_enabled()`
- `set_sleep_timer()` (en secondes)
- `set_ambients()` (valeurs RGB)

**Modèle de données :** Players agrègent device (identité immuable), info (settings/firmware), status (batterie, volume, charge), extended_status (réseau, disque, uptime), last_event (état playback via MQTT), is_online

**Gestion événements :**
- `connect_events()` — souscription MQTT avec callbacks
- Callbacks sync et async supportés
- Paramètres `on_update` et `on_disconnect`

**Erreurs :** `AuthenticationError`, `YotoAPIError`, `YotoMQTTError`

### Différences avec le client Node

- Supporte `next_track()` / `previous_track()` / `seek()` — à vérifier si ces commandes existent dans le client Node (non trouvé dans les sources inspectées)
- `extended_status` documenté comme disponible via MQTT ou REST shadow (fallback offline)
- La lib Python confirme que `data/status` ne se publie jamais spontanément sans requête préalable
- Session management externe supporté (utile pour Home Assistant)
- Support refresh token explicite via session externe

---

## 3. yoto-smart-stream (earchibald)

Repo : https://github.com/earchibald/yoto-smart-stream

### Architecture service

Stack : **FastAPI** (Python) + SQLite/PostgreSQL + stockage fichiers audio

Couches :
1. **Client Layer** — Web UI + PWA mobile via HTTP/WebSocket
2. **Application Layer** — FastAPI REST + MQTT event management + icon service
3. **Core Services** — Audio manager, script engine (Choose Your Own Adventure), card manager
4. **Data Layer** — Base de données + stockage fichiers
5. **External** — Yoto REST API + broker MQTT (`mqtt.yoto.io`)

### Patterns de streaming

Le player Yoto utilise un modèle **pull-based** :
- Le player fait des **GET HTTP** directement sur le serveur custom pour les fichiers audio
- Aucun upload sur l'infrastructure Yoto requis
- Supporte la navigation multi-chapitres avec boutons physiques
- Playback séquentiel contrôlé côté serveur

Workflow MYO card custom :
1. Upload audio sur le serveur custom
2. Conversion format (vers mp3/aac compatible Yoto)
3. Création carte MYO pointant vers les URLs du serveur
4. Player Yoto stream directement depuis le serveur

### Patterns d'événements MQTT

Événements entrants (device → serveur) : `play`, `pause`, actions boutons, position playback, level batterie, navigation chapitres, signaux de complétion

Le **Script Engine** répond aux appuis boutons pour implémenter des histoires interactives (Choose Your Own Adventure) — le MQTT est bidirectionnel pour cette logique.

---

## 4. Yoto-Scheduler (gandhiv88)

Repo : https://github.com/gandhiv88/Yoto-Scheduler  
Stack : React Native (Expo)

### Patterns de scheduling

- Planification audio basée sur l'heure : sélectionner une carte, définir une heure de déclenchement
- Deux modes : **Foreground** (Expo Go — uniquement si l'app est ouverte) et **Background** (build dev — automatique même app fermée)
- Le mode background **requiert un build de développement**, pas Expo Go

### Structure routines

Workflow en 4 étapes :
1. Ouvrir l'interface scheduler
2. Créer une entrée via le bouton +
3. Sélectionner la carte audio cible depuis la bibliothèque
4. Définir l'heure de déclenchement

Persistance entre sessions, édition et monitoring des schedules, notifications au déclenchement, vérification du statut des tâches background.

**Implication pour notre projet :** Si on veut des schedules côté serveur (plus fiable que mobile), il faudra implémenter notre propre système cron/scheduling — le Yoto-Scheduler est client-only mobile.

---

## 5. Icônes pixel (myo-magic + auto-icons + yopix)

### Format des icônes Yoto

- Taille fixe : **16x16 pixels**
- Référencées dans les playlists comme : `"icon16x16": "yoto:#<sha256-hash-base64>"`
- Exemple de hash : `3ZnJD74DawVPKntS3pIEpDlM57daHtDuczmf2JI_EBw`
- Format interne dans les listes d'icônes publiques : `"displayIconId"` (identifiant unique Yoto)
- Les icônes publiques Yoto ont un userId = `"yoto"` dans l'API

**API icônes :**
- GET `/media/displayIcons/user/yoto` → 352 icônes publiques avec title, tags, URL
- GET `/media/displayIcons/user/{userId}` → icônes custom de l'utilisateur

### Pipeline de matching existant (yoto-auto-icons)

Pipeline en 7 étapes avec hiérarchie de matching à 3 niveaux :
1. **Exact match** — mots-clés directs dans le titre de track
2. **Partial match** — matching flou avec synonymes
3. **AI Semantic match** — OpenAI Vision API en fallback (taux de succès global : 95%+)

Les 352 icônes publiques Yoto sont d'abord mappées vers des mots-clés sémantiques via OpenAI Vision. Les résultats sont stockés en JSON : `"keyword": "yoto:#[encoded-id]"`.

Les icônes générées custom (pour mots-clés sans correspondance) utilisent **DALL-E 3** et sont uploadées manuellement dans l'interface web Yoto.

### Logique d'édition pixel (YoPix)

- Éditeur web client-side (aucun backend) : https://yopix.trywait.com
- Basé sur la librairie open-source **Pixel It**
- Entrées : upload image, URL, Unsplash, icônes Yoto existantes, génération IA
- Prétraitement : crop + suppression background (optionnel)
- Éditeur interactif avec palette de couleurs (2-256 couleurs), outils standards, undo/redo
- Export : download PNG 16x16

**Implication :** Pour notre Control Center, on peut utiliser l'API `/media/displayIcons/user/yoto` pour afficher et sélectionner parmi les 352 icônes publiques sans avoir à gérer le pipeline de génération.

---

## Commandes API confirmées

| Commande | Mécanisme | Payload |
|---|---|---|
| Lancer une carte | MQTT `card/start` | `{ uri: "https://yoto.io/<cardId>", chapterKey?, trackKey?, secondsIn?, cutOff? }` |
| Stopper la lecture | MQTT `card/stop` | `{}` |
| Pause | MQTT `card/pause` | `{}` |
| Reprendre | MQTT `card/resume` | `{}` |
| Volume | MQTT `volume/set` | `{ volume: 0-100 }` |
| Couleur ambiante | MQTT `ambients/set` | `{ r: 0-255, g: 0-255, b: 0-255 }` |
| Timer extinction | MQTT `sleep-timer/set` | `{ seconds: N }` (0 = désactiver) |
| Prévisualiser icône | MQTT `display/preview` | `{ uri, timeout, animated: 0\|1 }` |
| Redémarrer | MQTT `reboot` | `{}` |
| BT on/off | MQTT `bluetooth/on` ou `bluetooth/off` | `{}` ou `{ mode, rssi?, name?, mac? }` |
| Mettre à jour config | REST PUT | `{ config: { maxVolumeLimit, dayTime, nightTime, alarms, ... } }` |
| Mettre à jour shortcuts | REST PUT | `{ shortcuts: { modes: { day, night } } }` |

---

## Topics MQTT identifiés

**Souscription (receive) :**
```
device/{deviceId}/data/events       — état playback temps réel (format documenté)
device/{deviceId}/events            — idem, ancien format (éviter)
device/{deviceId}/data/status       — statut device (répond à requestStatus())
device/{deviceId}/status            — statut legacy REQUIS pour lifecycle (startup/shutdown)
device/{deviceId}/response          — réponses aux commandes
```

**Publication (send) :**
```
device/{deviceId}/command/volume/set
device/{deviceId}/command/ambients/set
device/{deviceId}/command/sleep-timer/set
device/{deviceId}/command/card/start
device/{deviceId}/command/card/stop
device/{deviceId}/command/card/pause
device/{deviceId}/command/card/resume
device/{deviceId}/command/bluetooth/on
device/{deviceId}/command/bluetooth/off
device/{deviceId}/command/bluetooth/connect
device/{deviceId}/command/bluetooth/disconnect
device/{deviceId}/command/bluetooth/delete-bonds
device/{deviceId}/command/bluetooth/state
device/{deviceId}/command/display/preview
device/{deviceId}/command/reboot
device/{deviceId}/command/events/request
device/{deviceId}/command/status/request
```

**Broker :** `wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com:443`  
**Auth :** JWT Yoto via `PublicJWTAuthorizer`

---

## Architecture recommandée pour notre projet

### Stack recommandée
- **`yoto-nodejs-client`** comme dépendance principale — ne pas réimplémenter le client HTTP/MQTT
- `YotoAccount` pour gérer plusieurs devices simultanément
- `YotoDeviceModel` par device pour l'état stateful (events TypeScript propres)

### Structure du projet
```
yoto-control-center/
  src/
    lib/
      yoto/           # Wrapper autour de yoto-nodejs-client
    server/           # Next.js API routes ou FastAPI
    components/       # UI React
  .env.local          # YOTO_CLIENT_ID, tokens (jamais commités)
```

### Flux d'authentification recommandé
1. Flow Device Code pour l'auth initiale (CLI ou page dédiée)
2. Persistance des tokens dans une DB ou fichier chiffré (obligatoire — les tokens expirent)
3. `onTokenRefresh` callback pour mise à jour automatique

### Gestion état temps réel
- Utiliser `YotoDeviceModel` en mode event-driven (écouter `statusUpdate`, `playbackUpdate`, `online`, `offline`)
- Polling HTTP toutes les 10 minutes en fallback (`httpPollIntervalMs: 600000`)
- Souscrire aux 4 topics (dont le legacy status) pour capturer les lifecycle events

### Scheduling côté serveur
- Implémenter avec un scheduler Node.js (node-cron ou similar) — le Yoto-Scheduler est mobile-only
- Persister les schedules en DB avec mapping `{ deviceId, cardUri, time, days[] }`

### Icônes
- Utiliser l'API GET `/media/displayIcons/user/yoto` pour lister les 352 icônes publiques
- Référencer par `displayIconId` ou hash SHA-256
- Pour upload custom : utiliser l'interface web Yoto (pas d'API upload publique confirmée)

---

## Questions ouvertes

1. **Upload d'icônes custom via API** — L'API d'upload d'icônes n'a pas été trouvée dans les sources inspectées. Le repo yoto-auto-icons mentionne un upload manuel via l'interface web Yoto. À confirmer s'il existe un endpoint API.

2. **`next_track()` / `previous_track()` / `seek()`** — Ces méthodes sont documentées dans le client Python mais les topics MQTT correspondants n'ont pas été trouvés dans le client Node. Peut-être via `card/start` avec `trackKey`/`secondsIn` ?

3. **Limite de débit API** — Aucune documentation sur les rate limits trouvée. À monitorer en production.

4. **Contenu MYO — upload audio** — Le endpoint pour uploader des fichiers audio côté Yoto MYO n'a pas été inspecté en détail. Le smart-stream suggère que le player peut stream depuis un serveur externe sans upload chez Yoto.

5. **Yoto Mini vs Yoto Player — différences API** — Le champ `productType: 'mini'` apparaît dans les données. À vérifier si certaines commandes (display preview, bluetooth) ne s'appliquent qu'à certains modèles.

6. **`carissaallen/yoto-myo-magic`** — Ce repo retourne 404 (potentiellement privé ou supprimé). Son contenu sur les icônes pixel n'a pas pu être inspecté.

---

## Décisions d'implémentation

**On va faire :**
- Utiliser `yoto-nodejs-client` directement (npm install) — bien maintenu, TypeScript strict
- Implémenter le flow OAuth Device Code pour l'auth initiale
- Construire sur `YotoDeviceModel` pour l'état stateful par device
- Souscrire aux 4 topics MQTT dont le legacy pour les lifecycle events
- Utiliser l'API publique d'icônes pour la sélection dans l'UI
- Implémenter le scheduling côté serveur avec node-cron

**On ne va pas faire :**
- Réimplémenter le client HTTP/MQTT from scratch — yoto-nodejs-client couvre tout
- Utiliser le Yoto-Scheduler (React Native, foreground only)
- Implémenter un pipeline de génération d'icônes IA pour la v1 — utiliser les 352 icônes publiques
- Faire du streaming audio custom pour la v1 — utiliser les cartes MYO existantes de l'utilisateur
