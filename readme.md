# Installation et premier lancement


Création de l'espace de travail
-
> - `git clone https://github.com/paul-carretero/IonicTodo <dir>`
> - `cd <dir>`

Préparation de l'espace de travail
-
> - `./ohmytask.sh rebuild`

Lancement de l'application
-
> - `./ohmytask.sh debug` (env debug)
> - `./ohmytask.sh prod` (env prod : active les optimisations aot etc.)

Lancement du serveur de documentation
-
> - `./ohmytask.sh doc` 

# Todolist

- gérer les messages d'aide (alert) sur les pages
- créer les textes de synthèse vocale pour d'autres pages
- tester l'application globalement et vérifier les logs
- si possible dans le temps qu'il, créer une page de todo du jour

# Description des fonctionnalités mises en place

Listes de tâches
-
- OCR pour import de tâches
- Notion de propriétaire: Local (machine, non partageable), utilisateur (privée pour l'utilisateur connecté), et partagé (appartient à un autre utilisateur qui a partagée la liste).
- Ajout-Edition-Suppression (si local ou privée)- Suppression du partage (si liste partagée)

Todos
-
- Appartient à une liste
- peuvent être copier coller dans une autre liste par référence
- Contiennent un nom, une description, une adresse, une deadline, une date de notification, une liste de contacts associés, une liste de photo, des information sur la création-complétion
- Export vers le calendrier natif (ou suppression)

Partages de listes
-
- Partage de liste par référence, par référence en lecture seule (pas de modification des liste et todos, complété todo OK) et copie par valeur
- QR Code export/import
- NFC export/import depuis un Tag NFC
- ShakeToShare : partage de la liste courrante si deux evenement de shake ont lieu pas trop loin au meme moment
- Cloud OhMyTask (partage et récupération de liste global protégé par mot de passe) identifié par auteur-lieu
- Import de liste partagée (clone en local)
- partage à des contacts natif (option pour envoyer un sms, option d'import auto des partage dont on est la cible)

Reconnaissance vocale
-

Notifications
-
- choix d'une date de notification dans la page d'édition des todos
- synchronisation avec les date de notification des todos des liste partagé à la connexion
- alert si deadline todo proche à la connexion
- notification annulable

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

Publicité
-
- Bannières de pubs en haut (désactivable, on est sympa)
- Page Intersticiel ouvrable via le menu gauche (pas automatique, on est sympa x2)
- Google AdMob

Firebase Storage (photos)
-
- Un dossier pour chaque todo,
- Création éventuelle avant chaque création de todo
- Clean-up après suppression de todo ou abandon de création
- Import photo de la gallerie du téléphone
- Prise de photo avec la caméra

Authentification
-

Cloud Firestore
-

UI
-
- listes re-orderable
- description audio
- menu aide
- barre de recherche (filtre)

Mode Hors Ligne (== hors connexion)
-
- partage désactivé
- identifié par machine
- liste locale seulement
- restriction des actions possible
- cache firecloud (hors ligne possible)
- accessible hors ligne

# Limites
