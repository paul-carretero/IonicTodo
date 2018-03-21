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

  constructor(
    private readonly localNotifCtrl: LocalNotifications,
    private readonly uiCtrl: UiServiceProvider,
    private readonly dbCtrl: DBServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.firstLaunch = true;
    this.shouldAllCheck = true;
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
  private roundTime(date?: Date): number {
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
      const approxNow = this.roundTime();
      for (const todo of items) {
        if (
          todo.complete === false &&
          todo.deadline != null &&
          this.roundTime(todo.deadline) === approxNow
        ) {
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
          break;
        }

        if (
          this.firstLaunch &&
          todo.complete === false &&
          todo.notif != null &&
          this.roundTime(todo.notif) === approxNow
        ) {
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'TodoPage', data: { todoRef: todo.ref } });
          break;
        }
      }

      if (this.shouldAllCheck) {
        this.allCheck(items);
      }
      this.firstLaunch = false;
    });
  }

  private listenForAuthEvents(): void {
    this.authCtrl.getConnexionSubject().subscribe(() => {
      this.shouldAllCheck = true;
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
    if (!this.evtCtrl.getNetStatus()) {
      return;
    }

    await this.dbCtrl.fillNotifBuffer(items);
    const myId = this.authCtrl.getUserId();
    const deletedIds = await this.dbCtrl.getAndDeleteNotFoundNotif(myId);
    for (const id of deletedIds) {
      this.localNotifCtrl.clear(id);
    }

    for (const todo of items) {
      this.onTodoUpdate(todo);
    }
    this.shouldAllCheck = false;
  }

  /**************************************************************************/
  /************************ METHODES PUBLIQUE/GETTER ************************/
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
    }
  }

  /********************* BASIC PUBLIC TODO CRUD INTERFACE *******************/

  public async onTodoUpdate(todo: ITodoItem): Promise<void> {
    const now = new Date().getTime();
    if (todo.uuid == null) {
      return;
    }

    const notifId = await this.dbCtrl.getAndDeleteNotificationId(todo.uuid);
    if (notifId != null) {
      this.localNotifCtrl.clear(notifId);
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

  public async onTodoDelete(todo_uuid: string): Promise<void> {
    await this.dbCtrl.deleteNotifFromTodo(todo_uuid);
  }

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
}
