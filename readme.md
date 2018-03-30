# Installation et premier lancement

Certain plugins doivent être configurer pour fonctionner correctement ensemble, 
vous pouvez installer l'application de cette manière:
- `git clone https://github.com/paul-carretero/IonicTodo <dir>`
- `cd <dir>`
- `npm i`
- `ionic cordova platforms add android@6.4.0 `
- `ionic cordova platforms rm android`
- `cp -frv ./plugins_fixes/node_modules ./`
- `cp -frv ./plugins_fixes/plugins ./`
- `ionic cordova platforms add android@6.4.0`
- `ionic cordova run android --device --prod --aot --minifyjs --minifycss --optimizejs`


# Todolist

- gérer les messages d'aide (alert) sur les pages
- créer les textes de synthèse vocale pour d'autres pages
- terminer la reconnaissance vocale (avec le nouveau parseur?) pour les échanges de listes notamment
- finir page NFC
- tester l'application globalement et vérifier les logs
- vérifier que lors chaque accès à la page todopage on précise la liste d'où l'on vient (gestion des droits)
- si possible dans le temps qu'il, créer une page de todo du jour
- terminer jsdoc

## Fonctionnalités mises en place
- EVERYTHING
