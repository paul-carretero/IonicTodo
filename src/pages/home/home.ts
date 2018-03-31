import { Component } from '@angular/core';
import { IonicPage, NavController, reorderArray, ItemSliding } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';

import { ITodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { EventServiceProvider } from './../../providers/event/event-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';
import { DBServiceProvider } from '../../providers/db/db-service';
import { Settings } from '../../model/settings';

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
   * Observable des liste privée de l'utilisateur connecté
   *
   * @protected
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  protected todoList: ITodoList[];

  /**
   * Observable des liste privée et terminée de l'utilisateur connecté
   *
   * @protected
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  protected completeTodoList: ITodoList[];

  /**
   * Liste partagé sur la machine courrante
   *
   * @protected
   * @type {ITodoList[]}
   * @memberof HomePage
   */
  protected localTodoList: ITodoList[];

  /**
   * Liste des listes partagés avec cet utilisateur
   *
   * @protected
   * @type {Observable<ITodoList[]>}
   * @memberof HomePage
   */
  protected sharedTodoList: ITodoList[];

  /**
   * flux des recherches utilisateur
   *
   * @protected
   * @readonly
   * @type {Observable<string>}
   * @memberof HomePage
   */
  protected readonly search$: Observable<string>;

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
   * abonnement aux listes partagée
   *
   * @private
   * @type {Subscription}
   * @memberof HomePage
   */
  private sharedListSub: Subscription;

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
    private readonly todoService: TodoServiceProvider,
    private readonly settingCtrl: DBServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoList = [];
    this.completeTodoList = [];
    this.localTodoList = [];
    this.sharedTodoList = [];
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
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Vos Listes de Tâches';
    pageData.subtitle = 'Accueil';
    pageData.searchable = true;
    pageData.searchPlaceholders = 'chercher par liste ou auteur';
    this.evtCtrl.setHeader(pageData);

    this.initPrivateListSub();
    this.initLocalListSub();
    this.initSharedListSub();
  }

  /**
   * Termine les subscription aux listes privée et locales
   *
   * @memberof HomePage
   */
  ionViewWillLeave() {
    this.tryUnSub(this.listSub);
    this.tryUnSub(this.localListSub);
    this.tryUnSub(this.sharedListSub);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * ajoute dans une liste un observable de ses todos
   *
   * @private
   * @param {ITodoList} list
   * @returns {Promise<ITodoList>}
   * @memberof HomePage
   */
  private async renforceList(list: ITodoList): Promise<ITodoList> {
    if (list.uuid == null) {
      throw new Error('Identifiant de liste invalide');
    }
    list.metadata = await this.todoService.getListMetaData(list.uuid);
    return list;
  }

  /**
   * intialise et met à jour le tableau des listes privée
   * ajoute également l'ensemble de leur todo.
   *
   * @private
   * @memberof HomePage
   */
  private initPrivateListSub(): void {
    this.listSub = this.todoService
      .getTodoList(ListType.PRIVATE)
      .subscribe((lists: ITodoList[]) => {
        const todoListP: Promise<ITodoList>[] = [];
        for (const list of lists) {
          todoListP.push(this.renforceList(list));
        }
        Promise.all(todoListP).then(res => {
          this.dispatchList(res);
        });
      });
  }

  /**
   * Permet de créer deux liste en séparant les liste complétée et les liste non complétée
   *
   * @private
   * @param {ITodoList[]} privateTodoList
   * @memberof HomePage
   */
  private dispatchList(privateTodoList: ITodoList[]): void {
    const completeList = [];
    const notCompleteList = [];
    for (const list of privateTodoList) {
      if (
        list.metadata.todoTotal === 0 ||
        list.metadata.todoComplete < list.metadata.todoTotal
      ) {
        notCompleteList.push(list);
      } else {
        completeList.push(list);
      }
    }
    this.todoList = notCompleteList;
    this.completeTodoList = completeList;
  }

  /**
   * intialise et met à jour le tableau des listes locales
   * ajoute également l'ensemble de leur todo.
   *
   * @private
   * @memberof HomePage
   */
  private initLocalListSub(): void {
    this.localListSub = this.todoService
      .getTodoList(ListType.LOCAL)
      .subscribe((lists: ITodoList[]) => {
        const localtodoListP: Promise<ITodoList>[] = [];
        for (const list of lists) {
          localtodoListP.push(this.renforceList(list));
        }
        Promise.all(localtodoListP).then(res => {
          this.localTodoList = res;
        });
      });
  }

  /**
   * intialise et met à jour le tableau des listes partagées
   * ajoute également l'ensemble de leur todo.
   *
   * @private
   * @memberof HomePage
   */
  private initSharedListSub(): void {
    this.sharedListSub = this.todoService
      .getTodoList(ListType.SHARED)
      .subscribe((lists: ITodoList[]) => {
        const sharedtodoListP: Promise<ITodoList>[] = [];
        for (const list of lists) {
          sharedtodoListP.push(this.renforceList(list));
        }
        Promise.all(sharedtodoListP).then(res => {
          this.sharedTodoList = res;
        });
      });
  }

  /**
   * génère une description pour un tableau de liste donné
   *
   * @private
   * @param {ITodoList[]} todoList
   * @param {string} type
   * @returns {string}
   * @memberof HomePage
   */
  private getDescription(todoList: ITodoList[], type: string): string {
    let description = '';

    let list_desc = '';
    let have_list = false;
    for (const list of todoList) {
      have_list = true;
      if (list.metadata.atLeastOneLate) {
        list_desc +=
          ' ' +
          list.name +
          ' . Attention la liste ' +
          list.name +
          ' a au moins une tâche en retard ! ';
      } else {
        list_desc += ' ' + list.name + ' ,';
      }
    }
    if (have_list && todoList.length > 1) {
      description += ' Vos listes ' + type + ' sont : ' + list_desc + ' . ';
    }

    if (have_list && todoList.length === 1) {
      description += ' Votre liste ' + type + ' est : ' + list_desc + ' . ';
    }

    return description;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Permet de naviguer vers la page d'affichage des listes pour afficher une liste en fonction de son identifiant
   *
   * @param {string} uuid
   * @memberof HomePage
   */
  protected selectTodoList(uuid: string): void {
    this.navCtrl.push('TodoListPage', { uuid: uuid });
  }

  /**
   * Permet de naviguer vers la page de création de liste
   *
   * @memberof HomePage
   */
  protected createTodoList(): void {
    this.navCtrl.push('ListEditPage', { uuid: null });
  }

  /**
   * Permet de supprimer une liste avec son identifiant.
   * Supprime instantanément la liste du tableau afin de fluidifier l'affichage
   *
   * @protected
   * @param {ITodoList} liste une liste à supprimer
   * @param {ITodoList[]} tab tableau dans lequel est la liste
   * @param {ItemSliding} closable l'item sliding de la liste
   * @returns {Promise<void>}
   * @memberof HomePage
   */
  protected async deleteTodoList(
    liste: ITodoList,
    tab: ITodoList[],
    closable: ItemSliding
  ): Promise<void> {
    if (liste == null || tab == null || closable == null) {
      return;
    }

    const unsure_mode: boolean = await this.settingCtrl.getSetting(
      Settings.ENABLE_UNSURE_MODE
    );
    let confirm: boolean = true;

    if (unsure_mode) {
      const title = 'Suppression de la liste ' + liste.name;
      const message = 'Voulez vous supprimer la liste ' + liste.name;
      confirm = await this.uiCtrl.confirm(title, message);
    }

    if (confirm) {
      tab.splice(tab.indexOf(liste), 1);
      if (liste.uuid != null) {
        this.todoService.deleteList(liste.uuid);
      }
    }

    closable.close();
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
  protected async reorder(
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

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @protected
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  protected generateDescription(): string {
    let description = '';
    description += this.getDescription(this.todoList, ' de tâches en cours ');
    description += this.getDescription(this.completeTodoList, ' terminées ');
    description += this.getDescription(this.sharedTodoList, ' partagées ');
    description += this.getDescription(this.localTodoList, ' locales ');

    return description;
  }
}
