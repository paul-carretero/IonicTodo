import { ITodoItem } from './../../model/todo-item';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { DBServiceProvider } from './../db/db-service';
import { Injectable } from '@angular/core';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { UiServiceProvider } from '../ui-service/ui-service';
import { EventServiceProvider } from '../event/event-service';
import { Settings } from '../../model/settings';

@Injectable()
export class NotifServiceProvider {
  /**
   * flag permettant de ne recherche à rediriger vers un todo ayant une deadline
   * proche ssi on vient de lancer l'application (propablement par notif du coup)
   *
   * @private
   * @type {boolean}
   * @memberof NotifServiceProvider
   */
  private firstLaunch: boolean;

  private shouldAllCheck: boolean;

  /**
   * contient la liste des uuis des todo pour lesquels une action à été entreprise
   *
   * @private
   * @type {Date}
   * @memberof NotifServiceProvider
   */
  private todoIAlreadyAnnoyedUserFor: string[];

  constructor(
    private readonly localNotifCtrl: LocalNotifications,
    private readonly uiCtrl: UiServiceProvider,
    private readonly dbCtrl: DBServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.firstLaunch = true;
    this.shouldAllCheck = true;
    this.todoIAlreadyAnnoyedUserFor = [];
  }

  /**
   * retourne le temps moyen de maintenant en minutes arrondies
   *
   * @readonly
   * @type {number}
   * @memberof NotifServiceProvider
   */
  get approxNow(): number {
    return this.roundTime();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * retourne le temps de la date arrondi à la minute
   * /60000 pour avoir la minute la plus proche
   *
   * @private
   * @param {Date} [date]
   * @returns {number}
   * @memberof NotifServiceProvider
   */
  private roundTime(date?: Date | null): number {
    if (date == null) {
      date = new Date();
    }
    return Math.round(date.getTime() / 60000);
  }

  /**
   * Ecoute les mise à jour de l'ensemble des todo et si à une deadline maintenant (à peu près) alors propose l'utilisateur de l'y rediriger
   * Si l'utilisateur a effectué des opérations de connexion-déconnexion alors resynchronise la liste des notif avec la liste local
   *
   * @private
   * @memberof NotifServiceProvider
   */
  private checkForTodoSnapChange() {
    this.evtCtrl.getLastTodosSnapSub().subscribe(items => {
      // c'est des timestamp sur firestore...
      items.forEach(todo => {
        if (todo.notif != null) {
          todo.notif = new Date(todo.notif);
        }
      });
      this.checkNowTodoForRedirect(items);
      this.checkForAutoRedirect(items);

      if (this.shouldAllCheck) {
        this.allCheck(items);
      }

      this.firstLaunch = false;
    });
  }

  /**
   * Vérifie si un todo non complété arrive à échéance maintenant,
   * si c'est la cas alors propose à l'utilisateur de l'emmener sur la page du todo
   *
   * @private
   * @param {ITodoItem[]} items
   * @memberof NotifServiceProvider
   */
  private checkNowTodoForRedirect(items: ITodoItem[]): void {
    const nowTodo = items.find(
      todo =>
        todo.complete === false &&
        todo.uuid != null &&
        todo.notif != null &&
        this.todoIAlreadyAnnoyedUserFor.indexOf(todo.uuid) === -1 &&
        this.roundTime(todo.notif) === this.approxNow
    );

    if (nowTodo != null && nowTodo.uuid != null) {
      this.todoIAlreadyAnnoyedUserFor.push(nowTodo.uuid);
      this.askForRedirect(nowTodo);
    }
  }

  /**
   * Recherche un todo ayant une date de notification imminante.
   * Si un tel todo est trouvé et qu'il sagit du premier lancement
   * de l'application alors redirige l'utilisateur vers ce todo
   *
   * @private
   * @param {ITodoItem[]} items
   * @memberof NotifServiceProvider
   */
  private checkForAutoRedirect(items: ITodoItem[]): void {
    const nowTodoNotif = items.find(
      todo =>
        todo.complete === false &&
        todo.notif != null &&
        this.roundTime(todo.notif) === this.approxNow
    );

    if (
      this.firstLaunch &&
      nowTodoNotif != null &&
      nowTodoNotif.uuid != null &&
      nowTodoNotif.complete === false &&
      this.roundTime(nowTodoNotif.notif) === this.approxNow
    ) {
      console.log('auto' + nowTodoNotif.uuid);
      this.todoIAlreadyAnnoyedUserFor.push(nowTodoNotif.uuid);
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'TodoPage', data: { todoRef: nowTodoNotif.ref } });
    }
  }

  /**
   * demande à l'utilisateur si il souhaite être redirigé vers une tache.
   * envoie une demande de redirection si oui
   *
   * @private
   * @param {ITodoItem} todo
   * @memberof NotifServiceProvider
   */
  private askForRedirect(todo: ITodoItem): void {
    this.uiCtrl
      .confirm(
        'Tâche imminante',
        'la tâche ' +
          todo.name +
          " se termine maintenant et n'est pas complétée Voir la tâche?"
      )
      .then(res => {
        if (res) {
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'TodoPage', data: { todoRef: todo.ref } });
        }
      });
  }

  /**
   * Réinitialise des constantes lors de chaque connexion-déconnexion de
   * l'utilisateur pour synchroniser ses notifications et ses demandes
   *
   * @private
   * @memberof NotifServiceProvider
   */
  private listenForAuthEvents(): void {
    this.authCtrl.getConnexionSubject().subscribe(() => {
      this.shouldAllCheck = true;
      this.todoIAlreadyAnnoyedUserFor = [];
    });
  }

  /**
   * resynchronise l'ensemble des todo de l'utilisateur avec leur notification locale.
   * L'opération n'est réalisé ssi la machine en est ligne (snapshot non fiable autrement)
   *
   * @private
   * @param {ITodoItem[]} items
   * @returns {Promise<void>}
   * @memberof NotifServiceProvider
   */
  private async allCheck(items: ITodoItem[]): Promise<void> {
    if (
      !this.evtCtrl.getNetStatus() ||
      (await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF))
    ) {
      return;
    }
    const futureItems: ITodoItem[] = [];
    for (const item of items) {
      if (item.notif != null && item.notif.getTime() > this.approxNow) {
        futureItems.push(item);
      }
    }
    await this.dbCtrl.fillNotifBuffer(futureItems);
    const myId = this.authCtrl.getUserId();
    const deletedIds = await this.dbCtrl.getAndDeleteNotFoundNotif(myId);
    for (const id of deletedIds) {
      this.localNotifCtrl.clear(id);
      this.localNotifCtrl.cancel(id);
    }
    for (const todo of items) {
      this.onTodoUpdate(todo);
    }
    this.shouldAllCheck = false;
  }

  /**
   * Permet de créer une notification pour un todo, si possible
   *
   * @private
   * @param {ITodoItem} todo
   * @returns {Promise<number>}
   * @memberof NotifServiceProvider
   */
  private async createNewNotif(todo: ITodoItem): Promise<number> {
    if (todo.name == null || todo.notif == null) {
      return -1;
    }

    const id = await this.dbCtrl.getNextNotifId();
    this.localNotifCtrl.schedule({
      id: id,
      title: todo.name,
      text: 'Rappel : La tâche ' + todo.name + ' se termine bientôt !',
      data: { todoRef: todo.ref },
      at: this.roundTime(todo.notif)
    });
    return id;
  }

  /**************************************************************************/
  /**************************** METHODES PUBLIQUE ***************************/
  /**************************************************************************/

  /**
   * démarre le service en arrière plan et écoute les click sur les notifications
   *
   * @memberof NotifServiceProvider
   */
  public listenForEvents(): void {
    this.dbCtrl.deleteOutdatedNotif(new Date().getTime());
    this.dbCtrl.resetNotifBuffer();
    this.checkForTodoSnapChange();
    this.listenForAuthEvents();

    this.localNotifCtrl.on('click', (notification: any, state: any) => {
      console.log(notification);
      console.log(notification.data);
      this.uiCtrl.alert(notification.title, notification.data.mydata);
      console.log('state = ' + JSON.stringify(state));
    });
  }

  public async redefNotifStatus(): Promise<void> {
    const shouldReset = await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF);
    if (shouldReset) {
      this.dbCtrl.resetNotif();
      this.dbCtrl.resetNotifBuffer();
      this.localNotifCtrl.cancelAll();
      this.localNotifCtrl.clearAll();
    }
  }

  /********************* BASIC PUBLIC TODO CRUD INTERFACE *******************/

  /**
   * Appelé à chaque création ou modification de todo,
   * permet de synchroniser les notifications locales de ce todo
   *
   * @param {ITodoItem} todo
   * @returns {Promise<void>}
   * @memberof NotifServiceProvider
   */
  public async onTodoUpdate(todo: ITodoItem): Promise<void> {
    if (await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF)) {
      return;
    }

    const now = new Date().getTime();
    if (todo.uuid == null) {
      return;
    }

    const notifId = await this.dbCtrl.getAndDeleteNotificationId(todo.uuid);
    if (notifId != null) {
      this.localNotifCtrl.clear(notifId);
      this.localNotifCtrl.cancel(notifId);
    }

    if (
      todo.notif != null &&
      todo.complete !== false &&
      todo.name != null &&
      now < todo.notif.getTime()
    ) {
      const newId = await this.createNewNotif(todo);
      await this.dbCtrl.addNewNotif(todo.uuid, newId, this.roundTime(todo.notif));
    }
  }

  /**
   * Appelé à chaque suppression de todo, supprime les notifications associées
   *
   * @public
   * @param {string} todo_uuid
   * @returns {Promise<void>}
   * @memberof NotifServiceProvider
   */
  public async onTodoDelete(todo_uuid: string): Promise<void> {
    if (await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF)) {
      return;
    }

    const notifId = await this.dbCtrl.getAndDeleteNotificationId(todo_uuid);
    if (notifId != null) {
      this.localNotifCtrl.cancel(notifId);
      this.localNotifCtrl.clear(notifId);
    }
  }
}
