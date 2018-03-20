import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { IPageData } from './../../model/page-data';
import { ListType, ITodoList } from './../../model/todo-list';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../providers/event/event-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';

/**
 * Présente la listes des todo d'une liste de todo.
 * Donne également accès à des opérations sur cette liste (par des menus)
 *
 * @export
 * @class ListEditPage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-list-edit',
  templateUrl: 'list-edit.html'
})
export class ListEditPage extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * abonnment aux mises à jour de la liste
   *
   * @private
   * @type {Subscription}
   * @memberof ListEditPage
   */
  private listSub: Subscription;

  /**
   * Type de la liste en cours d'édition
   *
   * @private
   * @type {ListType}
   * @memberof ListEditPage
   */
  private listType: ListType;

  /**
   * Blanklist si nvelle ou la liste en train d'être editée
   *
   * @private
   * @type {ITodoList}
   * @memberof ListEditPage
   */
  private currentList: ITodoList;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * Formulaire d'édition de liste
   *
   * @type {FormGroup}
   * @memberof ListEditPage
   */
  protected newList: FormGroup;

  /**
   * Identifiant unique de la liste déjà existante, null si la liste est à créer
   *
   * @readonly
   * @type {string}
   * @memberof ListEditPage
   */
  protected readonly listUUID: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of ListEditPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {FormBuilder} formBuilder
   * @param {TodoServiceProvider} todoService
   * @param {NavParams} navParams
   * @memberof ListEditPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly formBuilder: FormBuilder,
    private readonly todoService: TodoServiceProvider,
    private readonly navParams: NavParams
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.listUUID = this.navParams.get('uuid');
    this.currentList = Global.getBlankList();
    this.defineNewList();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise le header de la page
   *
   * @memberof ListEditPage
   */
  ionViewDidEnter() {
    const header = Global.getValidablePageData();

    if (this.listUUID != null) {
      header.subtitle = 'Menu édition';
      this.defineEditList(header);

      this.deleteSub = this.todoService
        .getDeleteSubject(this.listUUID)
        .subscribe(() => this.hasBeenRemoved(true));
    } else {
      header.title = 'Nouvelle Liste';
      header.subtitle = 'Menu création';
      this.evtCtrl.setHeader(header);
    }
  }

  /**
   * termine les subscriptions
   *
   * @memberof ListEditPage
   */
  ionViewWillExit() {
    this.tryUnSub(this.listSub);
    this.todoService.unsubDeleteSubject();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @param {IMenuRequest} req
   * @memberof ListEditPage
   */
  public menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.VALIDATE:
        this.defList();
        break;
    }
  }

  /**
   * @override
   * @returns {string}
   * @memberof ListEditPage
   */
  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Authentification si liste partagée ou privée, sinon ok
   *
   * @override
   * @returns {boolean}
   * @memberof ListEditPage
   */
  public loginAuthRequired(): boolean {
    return this.listType === ListType.PRIVATE || this.listType === ListType.SHARED;
  }

  /**
   * Nécessaire d'être en mode navigation (offline ou connecté)
   *
   * @override
   * @returns {boolean} true
   * @memberof ListEditPage
   */
  public basicAuthRequired(): boolean {
    return true;
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * Permet d'inicialier le formulaire pour une nouvelle liste.
   * Verifie égalmement la possibilité de créer une liste en temps qu'utilisateur privé
   *
   * @private
   * @memberof ListEditPage
   */
  private defineNewList(): void {
    let local = false;
    if (!this.authCtrl.isConnected()) {
      local = true;
    }

    this.newList = this.formBuilder.group({
      name: ['', Validators.required],
      icon: ['list-box', Validators.required],
      local: [local, Validators.required]
    });

    const localForm = this.newList.get('local');
    if (!this.authCtrl.isConnected() && localForm != null) {
      localForm.disable();
    }
  }

  /**
   * Permet d'initialiser le formulaire dans le cas d'une mise à jour de liste
   *
   * @private
   * @param {IPageData} header
   * @returns {Promise<void>}
   * @memberof ListEditPage
   */
  private async defineEditList(header: IPageData): Promise<void> {
    this.listType = this.todoService.getListType(this.listUUID);

    let todoList: Observable<ITodoList>;

    try {
      todoList = await this.todoService.getAList(this.listUUID);
    } catch (error) {
      this.navCtrl.popToRoot();
      todoList = Observable.of(Global.getBlankList());
    }

    this.listSub = todoList.subscribe(list => {
      if (list != null) {
        this.currentList = list;
        header.title = 'Editer "' + list.name + '" ';
        this.evtCtrl.setHeader(header);

        const nameForm = this.newList.get('name');
        const iconForm = this.newList.get('icon');
        const localForm = this.newList.get('local');

        if (nameForm != null && iconForm != null && localForm != null) {
          nameForm.setValue(list.name);
          iconForm.setValue(list.icon);
          localForm.setValue(this.listType === ListType.LOCAL);
        }

        if (this.listType === ListType.SHARED && localForm != null) {
          localForm.disable();
        }
      }
    });
  }

  /**
   * Permet de tenter de mettre à jour les informations de la liste.
   * Redirige vers la liste mise à jour (ou re-créée)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof ListEditPage
   */
  private async updateList(): Promise<void> {
    this.uiCtrl.showLoading('Mise à jour de la liste...');

    let destType: ListType = this.listType;

    const localForm = this.newList.get('local');
    if (
      this.authCtrl.isConnected() &&
      localForm != null &&
      this.listType !== ListType.SHARED
    ) {
      if (localForm.value === true) {
        destType = ListType.LOCAL;
      } else {
        destType = ListType.PRIVATE;
      }
    }

    this.tryUnSub(this.deleteSub);
    this.todoService.unsubDeleteSubject();

    const newUuid = await this.todoService.updateList(
      {
        uuid: this.listUUID,
        name: this.newList.value.name,
        icon: this.newList.value.icon,
        order: this.currentList.order,
        author: this.currentList.author,
        externTodos: this.currentList.externTodos,
        metadata: this.currentList.metadata
      },
      destType
    );

    await this.navCtrl.push('TodoListPage', { uuid: newUuid });
    this.navCtrl.remove(1);
    if (this.listType !== destType) {
      this.navCtrl.remove(1);
    }
  }

  /**
   * Permet de créer une nouvelle liste
   * et de l'associer au compte courrant (si spécifié et si possible).
   * Redirige vers la liste nouvellement créée
   *
   * @private
   * @returns {Promise<void>}
   * @memberof ListEditPage
   */
  private async defineList(): Promise<void> {
    this.uiCtrl.showLoading('Création de la liste...');

    let destType: ListType = ListType.LOCAL;
    const localForm = this.newList.get('local');

    if (this.authCtrl.isConnected() && localForm != null && localForm.value === false) {
      destType = ListType.PRIVATE;
    }

    const nextUuid = await this.todoService.addList(
      {
        uuid: null,
        name: this.newList.value.name,
        icon: this.newList.value.icon,
        author: null,
        order: 0,
        externTodos: [],
        metadata: Global.getBlankMetaData()
      },
      destType
    );
    await this.navCtrl.push('TodoListPage', { uuid: nextUuid });
    this.navCtrl.remove(1);
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * Texte pour valider la création ou la modification de la liste
   *
   * @readonly
   * @type {string}
   * @memberof ListEditPage
   */
  get submitText(): string {
    if (this.listUUID == null) {
      return 'Créer une nouvelle liste';
    }
    return 'Mettre à jour cette liste';
  }

  /**
   * Permet de récupérer si il est possible de re-définir la liste comme privée-local
   * pas de sens si shared
   * pas possible si pas connecté
   *
   * @readonly
   * @type {boolean}
   * @memberof ListEditPage
   */
  get localChoice(): boolean {
    return this.authCtrl.isConnected() && this.listType !== ListType.SHARED;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Permet de tenter de créer ou de mettre à jour une liste en fonction de la validité du formulaire
   *
   * @memberof ListEditPage
   */
  public defList(): void {
    if (this.newList.valid) {
      if (this.listUUID == null) {
        this.defineList();
      } else {
        this.updateList();
      }
    } else {
      this.uiCtrl.alert(
        'Opération Impossible',
        "Veuillez vérifier d'avoir renseignée toutes les données"
      );
    }
  }
}
