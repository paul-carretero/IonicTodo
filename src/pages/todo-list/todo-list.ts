import { Component, ChangeDetectorRef } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { IonicPage, NavController, NavParams, reorderArray } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';

import { Media } from '../../model/media';
import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { Settings } from '../../model/settings';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { DBServiceProvider } from '../../providers/db/db-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { IAuthor } from './../../model/author';
import { IPageData } from './../../model/page-data';
import { ITodoItem } from './../../model/todo-item';
import { ITodoList, ListType } from './../../model/todo-list';
import { CloudServiceProvider } from './../../providers/cloud-service/cloud-service';
import { Global } from './../../shared/global';

@IonicPage()
@Component({
  selector: 'page-todo-list',
  templateUrl: 'todo-list.html'
})
export class TodoListPage extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * Identifiant unique d'une liste
   *
   * @private
   * @type {string}
   * @memberof TodoListPage
   */
  private readonly listUUID: string;

  private listName : string; 

  /**
   * Type (courrant) de la liste affiché
   * Le type dépend de l'utilisateur
   *
   * @private
   * @type {ListType}
   * @memberof TodoListPage
   */
  private listType: ListType;

  /**
   * Subscription pour update sur cette liste
   *
   * @private
   * @type {Subscription}
   * @memberof TodoListPage
   */
  private listeSub: Subscription;

  /**
   * true si aucune opération de ré-ordonement est en cours, false sinon
   * ne devrait pas durer plus de quelques ms
   *
   * @private
   * @type {boolean}
   * @memberof TodoListPage
   */
  private orderableReady: boolean = true;

  /**
   * Subscription aux todos en cours
   *
   * @private
   * @type {Subscription}
   * @memberof TodoListPage
   */
  private todoSub: Subscription;

  /**
   * Subscription aux todo complété
   *
   * @private
   * @type {Subscription}
   * @memberof TodoListPage
   */
  private completedSub: Subscription;

  /**
   * Subscription aux todos externes
   *
   * @private
   * @type {Subscription}
   * @memberof TodoListPage
   */
  private exportedSub: Subscription;

  /**
   * interval JS pour la detection des changement de la page
   *
   * @private
   * @type {*}
   * @memberof TodoListPage
   */
  private changeInterval: any;

  /**
   * timeoutJS a supprimer si la page est détruite trop vite
   *
   * @private
   * @type {*}
   * @memberof TodoListPage
   */
  private changeTimeout: any;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * Les todo non terminée de cette liste en observable
   *
   * @protected
   * @type {TodoItem[]}
   * @memberof TodoListPage
   */
  protected todoItems: ITodoItem[];

  /**
   * les todo terminés de cette liste en obsersable
   *
   * @protected
   * @type {ITodoItem[]}
   * @memberof TodoListPage
   */
  protected completedTodoItem: ITodoItem[];

  /**
   * Les todo exported de cette liste en observable
   *
   * @protected
   * @type {TodoItem[]}
   * @memberof TodoListPage
   */
  protected exportedTodoItems: ITodoItem[];

  /**
   * Signature de la liste affichée
   *
   * @protected
   * @type {(IAuthor | null)}
   * @memberof TodoListPage
   */
  protected listAuthor: IAuthor | null;

  /**
   * true si la liste n'est pas partagée en readonly
   *
   * @protected
   * @type {boolean}
   * @memberof TodoListPage
   */
  protected editable: boolean = true;

  /**
   * flux des recherches utilisateur
   *
   * @protected
   * @readonly
   * @type {Observable<string>}
   * @memberof HomePage
   */
  protected readonly search$: Observable<string>;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of TodoListPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {TodoServiceProvider} todoService
   * @param {NavParams} navParams
   * @param {DBServiceProvider} settingCtrl
   * @param {CloudServiceProvider} cloudCtrl
   * @param {ChangeDetectorRef} changeCtrl
   * @memberof TodoListPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly todoService: TodoServiceProvider,
    private readonly navParams: NavParams,
    private readonly settingCtrl: DBServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly changeCtrl: ChangeDetectorRef
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.listUUID = this.navParams.get('uuid');
    this.todoItems = [];
    this.completedTodoItem = [];
    this.exportedTodoItems = [];
    this.search$ = this.evtCtrl.getSearchSubject();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * Initialise la page en vérifiant le type de liste, initialisant le header et les différents tableau des todos.
   * Vérifie également que la liste ne sera pas supprimé (=> accueil si tel était le cas)
   *
   * @memberof TodoListPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    try {
      this.listType = this.todoService.getListType(this.listUUID);
    } catch (error) {
      this.navCtrl.popToRoot();
    }

    const pageData = Global.getShareEditPageData();
    pageData.searchable = true;
    pageData.subtitle = 'Détails des tâches';
    pageData.isList = true;
    this.initDataList(pageData);
    this.initTodoLists();
    this.deleteSub = this.todoService
      .getDeleteSubject(this.listUUID)
      .subscribe(() => this.hasBeenRemoved(true));
  }

  /**
   * Une fois que la vue est initialisé, défini le contexte courrant de la liste.
   * Override la detection de changement d'angular (sinon on spin-loop sur les date :/)
   * pour n'effectuer une detection des changemenents que toutes les 3s.
   *
   * @memberof TodoListPage
   */
  ionViewDidEnter(): void {
    this.evtCtrl.setCurrentContext(null, this.listUUID);

    this.changeTimeout = setTimeout(() => {
      this.changeCtrl.detach();
      this.changeCtrl.detectChanges();
      this.changeInterval = setInterval(() => {
        this.changeCtrl.detectChanges();
      }, 250);
    }, 250);
  }

  /**
   * Termines les subscriptions de la page
   *
   * réinitialise le détecteur de changement en mode normal et termine le contexte de la liste
   *
   * @memberof TodoListPage
   */
  ionViewWillLeave(): void {
    this.todoService.unsubscribeOfTodo();
    this.todoService.unsubDeleteSubject();
    this.tryUnSub(this.listeSub);
    this.tryUnSub(this.exportedSub);
    this.tryUnSub(this.todoSub);
    this.tryUnSub(this.completedSub);
    this.evtCtrl.setCurrentContext(null, null);

    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
    }

    if (this.changeInterval != null) {
      clearInterval(this.changeInterval);
    }
    this.changeCtrl.reattach();
  }

  /**************************************************************************/
  /************************ METHODE INTERNES/PRIVATE ************************/
  /**************************************************************************/

  /**
   * Initialise les tableau des todos en cours, terminés et externes
   *
   * @private
   * @memberof TodoListPage
   */
  private initTodoLists(): void {
    this.todoService
      .getPrivateTodos(this.listUUID, false)
      .then((res: Observable<ITodoItem[]>) => {
        this.todoSub = res.subscribe(tab => {
          this.todoItems = tab;
        });
      });

    this.todoService
      .getPrivateTodos(this.listUUID, true)
      .then((res: Observable<ITodoItem[]>) => {
        this.completedSub = res.subscribe(tab => {
          this.completedTodoItem = tab;
        });
      });

    this.todoService
      .getExportedTodosObservables(this.listUUID)
      .then((res: Observable<ITodoItem[]>) => {
        this.exportedSub = res.subscribe(tab => {
          this.exportedTodoItems = tab;
        });
      });
  }

  /**
   * Initialise les données de la liste pour l'affichage.
   * Effectue des vérifications sur la liste et poptoroot en cas d'incohérence
   *
   * @private
   * @param {IPageData} pageData
   * @returns {Promise<void>}
   * @memberof TodoListPage
   */
  private async initDataList(pageData: IPageData): Promise<void> {
    let todoList: Observable<ITodoList>;

    if (this.listType === ListType.SHARED) {
      pageData.importable = true;
      if (this.todoService.isReadOnly(this.listUUID)) {
        pageData.editable = false;
        this.editable = false;
      }
    } else {
      pageData.importable = false;
    }

    try {
      todoList = await this.todoService.getAList(this.listUUID);
    } catch (e) {
      this.navCtrl.popToRoot();
      todoList = Observable.of(Global.getBlankList());
    }

    this.listeSub = todoList.subscribe((res: ITodoList) => {
      if (res != null && res.name != null) {
        this.listName = res.name;
        pageData.title = 'Liste "' + res.name + '"';
        this.evtCtrl.setHeader(pageData);
        this.listAuthor = res.author;
      }
    });
  }

  /**
   * Permet de cloner une liste partagée et de supprimer le lien vers elle
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoListPage
   */
  private async importList(): Promise<void> {
    this.uiCtrl.showLoading('Import de la liste en cours');
    const list: ITodoList | null = this.todoService.getAListSnapshot(this.listUUID);

    if (list == null) {
      this.uiCtrl.displayToast("impossible d'importer la liste");
      return;
    }

    await this.todoService.addList(list, ListType.PRIVATE);
    this.todoService.removeListLink(this.listUUID);
    this.navCtrl.popToRoot();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @param {IMenuRequest} req
   * @returns {void}
   * @memberof TodoListPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.DELETE: {
        this.todoService.deleteList(this.listUUID);
        this.navCtrl.popToRoot();
        break;
      }
      case MenuRequestType.EDIT: {
        this.navCtrl.push('ListEditPage', { uuid: this.listUUID });
        break;
      }
      case MenuRequestType.IMPORT: {
        this.importList();
        break;
      }
      case MenuRequestType.OCR:
        {
          this.navCtrl.push('OcrModdalPage', {
            listUuid: this.listUUID
          });
        }
        break;
      case MenuRequestType.PASTE:
        {
          const todoRef = this.evtCtrl.getCopiedTodoRef();
          if (todoRef == null) {
            return;
          }
          this.todoService.addTodoLink(this.listUUID, todoRef);
        }
        break;
      case MenuRequestType.SHAKE:
        {
          this.settingCtrl.getSetting(Settings.ENABLE_STS).then((res: boolean) => {
            if (res) {
              this.cloudCtrl.stsExport(this.listUUID);
            }
          });
        }
        break;
      case MenuRequestType.SHARE: {
        switch (req.media) {
          case Media.QR_CODE:
            this.navCtrl.push('QrcodeGeneratePage', {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.QR_CODE }
            });
            break;
          case Media.NFC:
            this.navCtrl.push('NfcSenderPage', {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.NFC }
            });
            break;
          case Media.CLOUD:
            this.navCtrl.push('CloudSenderPage', {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.CLOUD }
            });
            break;
        }
        break;
      }
    }
  }

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof TodoListPage
   */
  protected loginAuthRequired(): boolean {
    return this.listType === ListType.PRIVATE || this.listType === ListType.SHARED;
  }

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof TodoListPage
   */
  protected basicAuthRequired(): boolean {
    return true;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Permet de supprimer ou de "délié" un todo de la liste
   *
   * @protected
   * @param {DocumentReference} todoRef
   * @param {boolean} ext
   * @returns {Promise<void>}
   * @memberof TodoListPage
   */
  protected async deleteTodo(todo: ITodoItem, ext: boolean): Promise<void> {
    if (todo == null || todo.ref == null || todo.uuid == null) {
      return;
    }
    if (ext) {
      this.todoService.removeTodoRef(this.listUUID, todo.ref);
    } else {
      this.todoService.deleteTodo(todo.ref, todo.uuid);
    }
  }

  /**
   * Permet de selectionner un todo et de l'afficher
   *
   * @protected
   * @param {DocumentReference} todoRef
   * @param {boolean} ext true si le todo est un todo externe à cette liste
   * @returns {Promise<void>}
   * @memberof TodoListPage
   */
  protected async selectTodo(todoRef: DocumentReference, ext: boolean): Promise<void> {
    if (todoRef == null || ext == null) {
      return;
    }
    this.navCtrl.push('TodoPage', {
      todoRef: todoRef,
      listUuid: this.listUUID,
      isExternal: ext
    });
  }

  /**
   * permet de terminer ou annuler la terminaison d'une tâche
   *
   * @protected
   * @param {ITodoItem} todo
   * @returns {void}
   * @memberof TodoListPage
   */
  protected completeCheck(todo: ITodoItem): void {
    if (todo == null || todo.ref == null) {
      this.uiCtrl.displayToast('Unexpected error is unexpected');
      return;
    }
    todo.complete = !todo.complete;
    this.todoService.complete(todo);
  }

  /**
   * Permet de redirigé vers la page de création de todo
   *
   * @protected
   * @memberof TodoListPage
   */
  protected createTodo(): void {
    this.navCtrl.push('TodoEditPage', {
      todoUUID: null,
      listUUID: this.listUUID
    });
  }

  protected areTodoMatching(todo: ITodoItem, search: string): boolean {
    if (search == null || search === '' || search === '#') {
      return true;
    }
    if (todo == null || todo.name == null) {
      return false;
    }
    if (todo.name.toUpperCase().includes(search)) {
      return true;
    }
    if (todo.desc != null && todo.desc.toUpperCase().includes(search)) {
      return true;
    }
    return false;
  }

  /**
   * permet de trier les todo d'un tableau de la liste
   *
   * @protected
   * @param {{ from: number; to: number }} indexes
   * @param {ITodoItem[]} tab
   * @returns {Promise<void>}
   * @memberof TodoListPage
   */
  protected async reorder(
    indexes: { from: number; to: number },
    tab: ITodoItem[]
  ): Promise<void> {
    if (!this.orderableReady) {
      return;
    }

    this.orderableReady = false;
    const promises: Promise<void>[] = [];
    tab = reorderArray(tab, indexes);
    for (let i = 0; i < tab.length; i++) {
      promises.push(this.todoService.updateTodoOrder(tab[i].ref, i));
    }
    await Promise.all(promises);
    this.orderableReady = true;
  }

  /**
   * vérifie et retourne si un todo est en retard
   *
   * @protected
   * @param {ITodoItem} todo
   * @returns {boolean}
   * @memberof TodoListPage
   */
  protected isLate(todo: ITodoItem): boolean {
    if (todo.complete === true || todo.deadline == null) {
      return false;
    }
    return todo.deadline < new Date();
  }


  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @protected
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  protected generateDescription(): string {
    let description : string = "";
    //const list = this.todoService.getAListSnapshot(this.listUUID);
    
    if( this.todoItems.length + this.completedTodoItem.length + this.exportedTodoItems.length === 0 ){
      description = "La liste " + this.listName + " est vide. " ;
    }
    else {
      description = " Pour la liste " + this.listName + " ";
      description += this.getDescription(this.todoItems, " en cours ");
      description += this.getDescription(this.completedTodoItem, " terminées ");
      description += this.getDescription(this.exportedTodoItems, " importées ");
    }
    return description;
  }

  private getDescription(todoItems : ITodoItem[], type : string) : string {
    let description = "";
    let todos_desc = "";
    let have_todo = false;
    for(const todo of todoItems ){
        have_todo = true ;
        todos_desc += " " + todo.name + " , ";
    }
    if(have_todo && todoItems.length > 1){
      description += "Les tâches " + type + " sont " + todos_desc + " . ";
    }
    if(have_todo && todoItems.length === 1){
      description += "La tâche " + type + " est " + todos_desc + " . ";
    }
    return description;
  }

}
