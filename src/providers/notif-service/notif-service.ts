import { ITodoSnapshot } from './../../model/todo-snap';
import { Injectable } from '@angular/core';
import { LocalNotifications } from '@ionic-native/local-notifications';

import { Settings } from '../../model/settings';
import { EventServiceProvider } from '../event/event-service';
import { UiServiceProvider } from '../ui-service/ui-service';
import { ITodoItem } from './../../model/todo-item';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { DBServiceProvider } from './../db/db-service';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { MenuRequestType } from '../../model/menu-request-type';

/**
 * gère les notifications native pour l'utilisateur et se synchronise avec les todo existant
 *
 * @export
 * @class NotifServiceProvider
 */
@Injectable()
export class NotifServiceProvider {
  /**
   * contient la liste des uuis des todo pour lesquels une action à été entreprise
   *
   * @private
   * @type {Date}
   * @memberof NotifServiceProvider
   */
  private todoIAlreadyAnnoyedUserFor: string[];

  /**
   * timeout après chaque connexion pour charger l'ensemble des todos connus et les synchroniser
   *
   * @private
   * @type {*}
   * @memberof NotifServiceProvider
   */
  private timeoutLog: any;

  /**
   * Creates an instance of NotifServiceProvider.
   * @param {LocalNotifications} localNotifCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {DBServiceProvider} dbCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @memberof NotifServiceProvider
   */
  constructor(
    private readonly localNotifCtrl: LocalNotifications,
    private readonly uiCtrl: UiServiceProvider,
    private readonly dbCtrl: DBServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoCtrl: TodoServiceProvider
  ) {
    this.todoIAlreadyAnnoyedUserFor = [];
    this.todoCtrl.notifRegister(this);
  }

  /**
   * retourne le temps moyen de maintenant en minutes arrondies
   *
   * @private
   * @readonly
   * @type {number}
   * @memberof NotifServiceProvider
   */
  private get approxNow(): number {
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
  private CheckOnLogin() {
    const items = this.todoCtrl.getAllTodos();
    items.forEach(todo => {
      if (todo.notif != null) {
        todo.notif = new Date(todo.notif);
      }
    });
    this.checkNowTodoForRedirect(items);
    if (this.authCtrl.isConnected() && this.evtCtrl.getNetStatus()) {
      this.allCheck(items);
    }
    this.timeoutLog = null;
  }

  /**
   * Vérifie si un todo non complété arrive à échéance maintenant (+/- 15 min),
   * si c'est la cas alors propose à l'utilisateur de l'emmener sur la page du todo
   *
   * @private
   * @param {ITodoItem[]} items
   * @memberof NotifServiceProvider
   */
  private checkNowTodoForRedirect(items: ITodoSnapshot[]): void {
    const nowTodo = items.find(
      todo =>
        todo.complete === false &&
        todo.uuid != null &&
        todo.deadline != null &&
        this.todoIAlreadyAnnoyedUserFor.indexOf(todo.uuid) === -1 &&
        this.roundTime(todo.deadline) <= this.approxNow + 15 &&
        this.roundTime(todo.deadline) >= this.approxNow - 15
    );

    if (nowTodo != null && nowTodo.uuid != null) {
      this.todoIAlreadyAnnoyedUserFor.push(nowTodo.uuid);
      this.askForRedirect(nowTodo);
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
  private async askForRedirect(todo: ITodoSnapshot): Promise<void> {
    if (todo.uuid !== this.evtCtrl.getCurrentContext(false)) {
      const res = await this.uiCtrl.confirm(
        'Tâche imminante',
        'la tâche ' +
          todo.name +
          " se termine maintenant et n'est pas complétée Voir la tâche?"
      );

      if (res && todo != null && todo.listUuids != null && todo.listUuids.length > 0) {
        if (this.evtCtrl.getCurrentContext(false) == null) {
          this.evtCtrl.getNavRequestSubject().next({
            page: 'TodoPage',
            data: { todoRef: todo.ref, listUuid: todo.listUuids[0] }
          });
        } else if (this.evtCtrl.getCurrentContext(false) !== todo.uuid) {
          this.evtCtrl.getMenuRequestSubject().next({
            request: MenuRequestType.VIEW,
            ref: todo.ref,
            uuid: todo.listUuids[0]
          });
        }
      }
    }
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
      this.todoIAlreadyAnnoyedUserFor = [];
      if (this.timeoutLog != null) {
        clearTimeout(this.timeoutLog);
      }
      this.timeoutLog = setTimeout(() => this.CheckOnLogin(), 10000);
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
    if (this.evtCtrl.getNetStatus() && !await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF)) {
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
    }
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
    if (todo.name == null || todo.notif == null || todo.ref == null) {
      return -1;
    }
    const id = await this.dbCtrl.getNextNotifId();
    this.localNotifCtrl.schedule({
      id: id,
      title: todo.name,
      text: 'Rappel : La tâche ' + todo.name + ' se termine bientôt !',
      data: { todoUuid: todo.uuid },
      at: todo.notif,
      icon: 'http://carretero.ovh/icon.png'
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
    this.listenForAuthEvents();

    this.localNotifCtrl.on('click', (notification: any) => {
      if (notification.data != null && notification.data.todoUuid != null) {
        const todos = this.todoCtrl.getAllTodos();
        const todo = todos.find(t => t.uuid === notification.data.todoUuid);
        if (todo != null && todo.listUuids != null && todo.listUuids.length > 0) {
          if (this.evtCtrl.getCurrentContext(false) == null) {
            this.evtCtrl.getNavRequestSubject().next({
              page: 'TodoPage',
              data: { todoRef: todo.ref, listUuid: todo.listUuids[0] }
            });
          } else if (this.evtCtrl.getCurrentContext(false) !== todo.uuid) {
            this.evtCtrl.getMenuRequestSubject().next({
              request: MenuRequestType.VIEW,
              ref: todo.ref,
              uuid: todo.listUuids[0]
            });
          }
        }
      }
    });
  }

  /**
   * si les notifications sont désactivé globalement alors supprime toutes les entrées associées
   *
   * @returns {Promise<void>}
   * @memberof NotifServiceProvider
   */
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
    if (!await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF)) {
      const now = new Date().getTime();

      if (todo.uuid != null) {
        const notifId = await this.dbCtrl.getAndDeleteNotificationId(todo.uuid);

        if (notifId != null) {
          this.localNotifCtrl.clear(notifId);
          this.localNotifCtrl.cancel(notifId);
        }

        if (
          todo.notif != null &&
          todo.complete === false &&
          todo.name != null &&
          now < todo.notif.getTime()
        ) {
          const newId = await this.createNewNotif(todo);
          await this.dbCtrl.addNewNotif(
            todo.uuid,
            newId,
            this.roundTime(todo.notif),
            this.authCtrl.getUserId()
          );
        }
      }
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
    if (!await this.dbCtrl.getSetting(Settings.DISABLE_NOTIF)) {
      const notifId = await this.dbCtrl.getAndDeleteNotificationId(todo_uuid);
      if (notifId != null) {
        this.localNotifCtrl.cancel(notifId);
        this.localNotifCtrl.clear(notifId);
      }
    }
  }
}
