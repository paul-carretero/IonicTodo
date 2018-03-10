import { Component } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController
} from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';

import { TodoList, ListType } from '../../model/todo-list';
import { SpeechRecServiceProvider } from '../../providers/speech-rec-service/speech-rec-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { MenuRequest } from './../../model/menu-request';
import { TodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Global } from './../../shared/global';
import { ListEditPage } from './../list-edit/list-edit';
import { TodoListPage } from './../todo-list/todo-list';

/**
 * Page principale de l'application.
 * Présente les différentes liste de tâches gérées par l'application
 * @export
 * @class HomePage
 * @extends {GenericPage}
 */
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends GenericPage {
  /**
   * Observable des liste privée de l'utilisateur connecté
   *
   * @type {Observable<TodoList[]>}
   * @memberof HomePage
   */
  public todoList: Observable<TodoList[]>;

  /**
   * Liste partagé sur la machine courrante
   *
   * @type {Observable<TodoList[]>}
   * @memberof HomePage
   */
  public localTodoList: Observable<TodoList[]>;

  /**
   * Creates an instance of HomePage.
   * @param {NavController} navCtrl
   * @param {AlertController} alertCtrl
   * @param {LoadingController} loadingCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {TodoServiceProvider} todoService
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {SpeechRecServiceProvider} speechCtrl
   * @memberof HomePage
   */
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    private todoService: TodoServiceProvider,
    private speechCtrl: SpeechRecServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl);
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
    const pageData = Global.NO_MENU_PAGE_DATA;
    pageData.title = 'Listes de Tâches';
    this.evtCtrl.getHeadeSubject().next(pageData);

    this.todoList = this.todoService.getTodoList(ListType.PRIVATE);
    this.localTodoList = this.todoService.getTodoList(ListType.LOCAL);
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   *
   * @override
   * @param {MenuRequest} req
   * @memberof HomePage
   */
  public menuEventHandler(req: MenuRequest): void {
    switch (req) {
      case MenuRequest.HELP: {
        this.alert(
          'Aide sur la page',
          "TODO: ecrire de l'aide<br/>nouvelle ligne !"
        );
        break;
      }
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

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Dans une liste de todo, recherche si au moins un todo est en retard par rapport à la deadline
   * Un todo est en retard si la date courrante est superieure à sa deadline
   *
   * @param {TodoList} list une liste de todo
   * @returns {boolean} true si au moins un todo est en retard
   * @memberof HomePage
   */
  public isOneTodoLate(list: TodoList): boolean {
    return true;
    //TODO
  }

  /**
   * Calcul le nombre de todo complété dans un tableau de todo
   *
   * @param {TodoItem[]} list un tableaud de todo
   * @returns {Number} le nombre de todo complété dans un tableaud do todo
   * @memberof HomePage
   */
  public getCompleted(list: TodoItem[]): Number {
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
    this.navCtrl.push(TodoListPage, { uuid: uuid });
  }

  /**
   * Permet de naviguer vers la page de création de liste
   *
   * @memberof HomePage
   */
  public createTodoList(): void {
    this.navCtrl.push(ListEditPage, { uuid: null });
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
