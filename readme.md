# Installation et premier lancement


Création de l'espace de travail
-
> - `git clone https://github.com/paul-carretero/IonicTodo <dir>`
> - `cd <dir>`

Préparation de l'espace de travail
-
> - `./ohmytask.sh rebuild` (-aucune garantie-... dépendra des mises à jours éventuelles des plugins...)

Lancement de l'application
-
> - `./ohmytask.sh debug` (env debug)
> - `./ohmytask.sh prod` (env prod : active les optimisations aot etc.)

Lancement du serveur de documentation
-
> - `./ohmytask.sh doc`
> - ouvrir `127.0.0.1:8080`

# Fonctionnalités TL;DR
- SSO Firebase et Google+
- Cloud Firestore
- Partage de listes: (référence ou valeur) & (qrcode, cloud, nfc, shakeToShare, pour un contact)
- Photos par todos sur Firebase Storage (gallerie ou prises de vues)
- Google Map et géolocalisation
- Mode hors ligne - hors connexion
- Publicités
- Reconnaissance - Synthèse vocale
- Notifications native
- Meteo pour les tâches
- OCR de tâches -  tâche copiable dans d'autre listes
- SMS planifiés - gestion des contacts associés
- Application paramétrable (localement)

# Description des fonctionnalités mises en place

Listes de tâches
-
- OCR pour import de tâches
- Notion de propriétaire: Local (machine, non partageable), utilisateur (privée pour l'utilisateur connecté), et partagé (appartient à un autre utilisateur qui a partagée la liste).
- Ajout-Edition-Suppression (si local ou privée)- Suppression du partage, édition (si liste partagée)

Todos
-
- Appartiennent à une liste
- Peuvent être copier coller dans une autre liste par référence
- Contiennent un nom, une description, une adresse, une deadline, une date de notification, une liste de contacts associés, une liste de photos, des informations sur la création-complétion
- Export vers le calendrier natif (ou suppression)
- Autre propriétés techniques explicitées dans les paragraphes suivants
- SMS à la complétions des contacts associés

Partages de listes
-
- Partage de liste par référence, par référence en lecture seule (pas de modification des liste et todos, complétées todo OK) et copie par valeur
- QR Code export/import
- NFC export/import depuis un Tag NFC (expérimental)
- ShakeToShare : partage de la liste courrante si deux evenement de shake ont lieu pas trop loin au meme moment
- Cloud OhMyTask (partage et récupération de liste global protégé par mot de passe) identifié par auteur-lieu
- Import de liste partagée (clone en local)
- partage à des contacts natif (option pour envoyer un sms, option d'import auto des partage dont on est la cible)

Reconnaissance vocale
- 
- Reconnaissance vocale de mots clés pour réaliser des actions liées aux listes et aux todos.
- La reconnaissance vocale utilise un parser pour reconnaître les actions demandées et la liste ou tâche demandées.
- Les actions peuvent être indépendentes de la page courante ou elles peuvent y être liées.
- Il est possible de créer, de partager, d'envoyer, de visualiser, de supprimer une liste.
- Il est possible d'ajouter une tâche dans une liste, de marquer une tâche comme complète.
- Il est possible de visualiser, de supprimer une tâche.
- Il est possible d'être redirigé vers les pages d'édition d'une liste ou d'une tâche.
- Il est possible de demander de l'aide sur l'utilisation de la reconnaissance vocale.

Synthèse vocale
-
- La synthèse vocale est utilisée en tant que retour utilisateur lors de l'utilisation de la reconnaissance vocale.
- La synthèse vocale est utilisée pour lire le contenu de certaines pages : la page de l'ensemble des listes, la page d'une liste, la page d'une tâche, ...

Notifications
-
- choix d'une date de notification dans la page d'édition des todos
- synchronisation avec les date de notification des todos des listes partagées à la connexion
- alert si deadline todo proche à la connexion
- notification annulable globalement
- clique pour voir la tâche concernée
- synchronisation par tâches et par utilisateur

Authoring et géolocalisation
-
- partage, liste et todo signé
- signature comporte: nom de l'autheur, la date et le lieu
- Map (google map) des point d'intéret pour chaque todo (addresse, position actuelle utilisateur, création, complétion)

Configuration
-
- activation - désactivation de la connexion automatique
- activation - désactivation du mode hors connexion (utilisateur authentifié seulement)
- activation - désactivation de ShakeToShare
- activation - désactivation de l'envoie automatique de sms
- activation - désactivation des notifications
- activation - désactivation de la synthèse vocale des notifications
- activation - désactivation de la confirmation de suppression de todo/liste
- activation - désactivation de l'import auto de liste addressé au compte courrant
- activation - désactivation des bannières de publicités

Meteo
-
- meteo des lieux des todos instantanée sur la page des todo
- prévision 5 jours de la ville du lieu d'un todo (temps moyen de la journée)
- API openweather

Publicité
-
- Bannières de pubs en haut (désactivable, on est sympa)
- Page Interstitiel ouvrable via le menu gauche (pas automatique, on est sympa x2)
- SDK Google AdMob

Firebase Storage (photos)
-
- Un dossier pour chaque todo,
- Création éventuelle avant chaque création de todo
- Clean-up après suppression de todo ou abandon de création
- Import photo de la gallerie du téléphone
- Prise de photo avec la caméra

Authentification
-
- Authentification par email-mot de passe
- Authentification Google+
- reset du mot de passe
- mise à jour des informations du compte
- statistique d'utilisation du compte

Cloud Firestore
-
- Firebase Firestore et Firebase Storage utilisés pour le projet
- Règles de sécurité basique
- Architecture firestore:
> - `machine/{machineId}` => Document d'informations sur la machine, SMS sauvegardés notament
> - `machine/{machineId}/list/` => Collections des listes locales d'une machine
> - `machine/{machineId}/list/{listId}/` => Document des données d'une liste locale d'une machine
> - `machine/{machineId}/list/{listId}/todo` => Collections des tâches d'une liste locale d'une machine
> - `machine/{machineId}/list/{listId}/todo/{todoId}` => Document des données d'une tâche d'une liste locale d'une machine

> - `user/{userId}` => Document d'informations sur un utilisateur authentifié (stats liste partagées etc.)
> - `user/{userId}/list/` => Collections des listes locales d'un utilisateur
> - `user/{userId}/list/{listId}/` => Document des données d'une liste locale d'un utilisateur
> - `user/{userId}/list/{listId}/todo` => Collections des tâches d'une liste locale d'un utilisateur
> - `user/{userId}/list/{listId}/todo/{todoId}` => Document des données d'une tâche d'une liste locale d'un utilisateur

> - `timestamp/ts` => Timestamp serveur

> - `cloud/` => Collections des partages de listes entre utilisateur
> - `cloud/{cloudId}` => Document d'un partage de liste (sur le cloud OhMyTask ou privé)

- Architecture Firebase Storage:
> - `{todoId}/` => repertoire des images d'un todo
> - `{todoId}/{imageId}` => image d'un todo

UI
-
- Listes re-orderable
- Description audio
- Aide pour chaque page
- Barre de recherche (filtre)
- Icone descriptive, code couleur
- Menu vertical et onglets
- mise à jour auto de l'affichage & protection contre les erreurs utilisateur

Mode Hors Ligne (AKA hors connexion)
-
- Partage désactivé
- Identifié par machine
- Liste locale seulement
- Restriction des actions possible
- Cache firecloud (hors ligne possible)
- Accessible hors ligne

Divers
-
- Envoi de SMS automatique
- Plannification SMS
- Surveillance de la connexion réseau => adaptation des choix utilisateur
- Surveillance de la disponibilité des listes et tâche (si elles n'ont pas été supprimée par d'autre utilisateur avec lequel elle seraient partagées) => retour à Home avec un message
- Code nettoyé avec TSLint
- Documentation du code


# Limites (AKA Knows Bugs)

Incompatibilité entre le plugin de prévisualisation (scan QR Code) et le plugin natif GoogleMap
-
- Les deux plugins exploitent la même technique de rendu (fond transparent du navigateur). Le plugin de preview est en Beta. Si le plugin de preview est chargé depuis la page de scan QRCode alors il ne sera plus possible d'afficher de map GoogleMap.
- Fix immédiat: redémarrer l'application
- Evolution envisagée: Changer de plugin de prévisualisation

Notifications non mises à jour en temps réel si un AUTRE utilisateur modifie leur date de notification (contexte de listes partagées)
-
- La synchronisation étant couteuse, elle n'est faite que lors de la connexion d'un utilisateur. De plus, la période de disponibilité de l'application est supposé faible, il n'était de toutes façons pas envisageable de synchroniser les notifications lorsque l'application est éteinte. Le comportement est tel qu'attendu si l'utilisateur modifie lui-même une tâche.
- Fix immédiat: se relogger
- Evolution envisagée: -

Page d'accueil non mise à jour en cas de complétion de tâche des listes (contexte de listes partagées)
-
- Afin de garantir un affichage fluide, les tâches ne sont pas mises à jour en temps réel sur la page d'accueil. Ainsi si un autre utilisateur complète une tâche alors le statut de la liste ne changera pas. Les tâches des listes sont synchronisées à chaque affichage de la page d'accueil ou lors de la mise à jour d'une des listes. (Les tâches sont bien automatiquement synchronisées dans les affichages d'une liste et dans l'affichage de tâches).
- Fix immédiat: changer de page et revenir à la page home
- Evolution envisagée: - maintenir l'état des tâches en temps réel (cf branche #home-realtime-update, obsolète mais illustrant une implémentation et ses limites). Solution abandonnée pour des problèmes de fluidité d'affichage.
