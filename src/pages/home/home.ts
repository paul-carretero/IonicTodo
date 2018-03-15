import { Component } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController,
  ToastController,
  IonicPage
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { ITodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { IMenuRequest } from './../../model/menu-request';
import { ITodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Global } from './../../shared/global';

/**
 * Page principale de l'application.
 * Présente les différentes liste de tâches gérées par l'application
 * @export
 * @class HomePage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends GenericPage {
  /**
   * Observable des liste privée de l'utilisateur connecté
   *
   * @type {Observable<ITodoList[]>}
   * @memberof HomePage
   */
  public todoList: Observable<ITodoList[]>;

  /**
   * Liste partagé sur la machine courrante
   *
   * @type {Observable<ITodoList[]>}
   * @memberof HomePage
   */
  public localTodoList: Observable<ITodoList[]>;

  /**
   * Liste des listes partagés avec cet utilisateur
   *
   * @type {Observable<ITodoList[]>}
   * @memberof HomePage
   */
  public sharedTodoList: Observable<ITodoList[]>;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of HomePage.
   * @param {NavController} navCtrl
   * @param {AlertController} alertCtrl
   * @param {LoadingController} loadingCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {ToastController} toastCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {TodoServiceProvider} todoService
   * @memberof HomePage
   */
  constructor(
    public readonly navCtrl: NavController,
    public readonly alertCtrl: AlertController,
    public readonly loadingCtrl: LoadingController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly todoService: TodoServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * S'inscit pour être notifier des listes de todo privées, locales et partagées
   * Initialise également la vue
   *
   * @memberof HomePage
   */
  ionViewDidEnter() {
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Listes de Tâches';
    this.evtCtrl.getHeadeSubject().next(pageData);

    this.todoList = this.todoService.getTodoList(ListType.PRIVATE);
    this.localTodoList = this.todoService.getTodoList(ListType.LOCAL);
    this.sharedTodoList = this.todoService.getTodoList(ListType.SHARED);
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   *
   * @override
   * @param {IMenuRequest} req
   * @memberof HomePage
   */
  public menuEventHandler(req: IMenuRequest): void {
    switch (req) {
    }
  }

  /**
   *
   * @override
   * @returns {string}
   * @memberof HomePage
   */
  public generateDescription(): string {
    let description = 'Voici vos liste de tâches en cours:';
    description += 'Voici vos liste de tâches terminé:';
    return description;
  }

  public loginAuthRequired(): boolean {
    return false;
  }

  public basicAuthRequired(): boolean {
    return true;
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  get isConnected(): boolean {
    return this.authCtrl.isConnected();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Dans une liste de todo, recherche si au moins un todo est en retard par rapport à la deadline
   * Un todo est en retard si la date courrante est superieure à sa deadline
   *
   * @param {ITodoList} list une liste de todo
   * @returns {boolean} true si au moins un todo est en retard
   * @memberof HomePage
   */
  public isOneTodoLate(): boolean {
    return true;
    //TODO
  }

  /**
   * Calcul le nombre de todo complété dans un tableau de todo
   *
   * @param {ITodoItem[]} list un tableaud de todo
   * @returns {Number} le nombre de todo complété dans un tableaud do todo
   * @memberof HomePage
   */
  public getCompleted(list: ITodoItem[]): Number {
    let res = 0;
    for (const item of list) {
      if (item.complete) {
        res++;
      }
    }
    return res;
  }

  /**
   * Permet de naviguer vers la page d'affichage des listes pour afficher une liste en fonction de son identifiant
   *
   * @param {string} uuid
   * @memberof HomePage
   */
  public selectTodoList(uuid: string): void {
    this.navCtrl.push('TodoListPage', { uuid: uuid });
  }

  /**
   * Permet de naviguer vers la page de création de liste
   *
   * @memberof HomePage
   */
  public createTodoList(): void {
    this.navCtrl.push('ListEditPage', { uuid: null });
  }

  /**
   * Permet de supprimer une liste avec son identifiant
   *
   * @param {string} uuid
   * @memberof HomePage
   */
  public deleteTodoList(uuid: string): void {
    this.todoService.deleteList(uuid);
  }
}
