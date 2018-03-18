import { Component } from '@angular/core';
import { IonicPage, NavController, reorderArray } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { ITodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { IMenuRequest } from './../../model/menu-request';
import { ITodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';
import { Subscription } from 'rxjs';

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
  /***************************** PUBLIC FIELDS ******************************/
  /**
   * Observable des liste privée de l'utilisateur connecté non terminée
   *
   * @public
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  public todoList: ITodoList[];

  /**
   * Observable des liste privée de l'utilisateur connecté terminée
   *
   * @public
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  public todoListComplete: ITodoList[];

  /**
   * Liste partagé sur la machine courrante
   *
   * @public
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  public localTodoList: ITodoList[];

  /**
   * Liste des listes partagés avec cet utilisateur
   *
   * @public
   * @type {Observable<ITodoList[]>}
   * @memberof HomePage
   */
  public sharedTodoList: Observable<ITodoList[]>;

  /**
   * flux des recherches utilisateur
   *
   * @readonly
   * @type {Observable<string>}
   * @memberof HomePage
   */
  public readonly search$: Observable<string>;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * abonemment aux listes utilisateur privée
   *
   * @private
   * @type {Subscription}
   * @memberof HomePage
   */
  private listSub: Subscription;

  /**
   * abonnement aux listes de la machines
   *
   * @private
   * @type {Subscription}
   * @memberof HomePage
   */
  private localListSub: Subscription;

  /**
   * true si aucune opération de ré-ordonement est en cours, false sinon
   * ne devrait pas durer plus de quelques ms
   *
   * @private
   * @type {boolean}
   * @memberof HomePage
   */
  private orderableReady: boolean = true;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of HomePage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {TodoServiceProvider} todoService
   * @memberof HomePage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly todoService: TodoServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoList = [];
    this.todoListComplete = [];
    this.localTodoList = [];
    this.search$ = this.evtCtrl.getSearchSubject();
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
    pageData.title = 'Vos Listes de Tâches';
    pageData.subtitle = 'Accueil OhMyTask';
    pageData.searchable = true;
    pageData.searchPlaceholders = 'chercher par liste ou auteur';
    this.evtCtrl.setHeader(pageData);

    this.initPrivateListSub();
    this.initLocalListSub();
    this.sharedTodoList = this.todoService.getTodoList(ListType.SHARED);
  }

  /**
   * Termine les subscription aux listes privée et locales
   *
   * @memberof HomePage
   */
  ionViewWillLeave() {
    this.tryUnSub(this.listSub);
    this.tryUnSub(this.localListSub);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  private initPrivateListSub(): void {
    this.listSub = this.todoService
      .getTodoList(ListType.PRIVATE)
      .subscribe((lists: ITodoList[]) => {
        this.todoList = [];
        this.todoListComplete = [];
        for (const list of lists) {
          //const isNotComplete = this.getCompleted(list.items) < list.items.length || list.items.length === 0;
          const isNotComplete = true;
          if (isNotComplete) {
            this.todoList.push(list);
          } else {
            this.todoListComplete.push(list);
          }
        }
      });
  }

  private initLocalListSub(): void {
    this.localListSub = this.todoService
      .getTodoList(ListType.LOCAL)
      .subscribe((lists: ITodoList[]) => {
        this.localTodoList = [];
        for (const list of lists) {
          this.localTodoList.push(list);
        }
      });
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

  /**
   * lorsque l'utilisateur tente de réorganiser ses listes
   * Reorganise rapidement en local la liste avant de la soumettre au service (elle sera alors re-rafraichi lors de la maj firebase)
   * Garde la consistence de l'ordre des autres éléments
   *
   * @param {{ from: number; to: number }} indexes
   * @param {ITodoList[]} tab le tableau de référence (soit todoList, soit todoListComplete, soit TodoListLocal)
   * @memberof HomePage
   */
  public async reorder(
    indexes: { from: number; to: number },
    tab: ITodoList[]
  ): Promise<void> {
    if (!this.orderableReady) {
      return;
    }

    this.orderableReady = false;
    const promises: Promise<void>[] = [];
    tab = reorderArray(tab, indexes);
    for (let i = 0; i < tab.length; i++) {
      promises.push(this.todoService.updateOrder(tab[i].uuid, i));
    }
    await Promise.all(promises);
    this.orderableReady = true;
  }
}
