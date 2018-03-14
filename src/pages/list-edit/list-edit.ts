import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { ListType } from './../../model/todo-list';
import { IPageData } from './../../model/page-data';
import { Global } from './../../shared/global';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ToastController,
  Events
} from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { TodoListPage } from '../todo-list/todo-list';
import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';

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
  /**
   * Formulaire d'édition de liste
   *
   * @type {FormGroup}
   * @memberof ListEditPage
   */
  public newList: FormGroup;

  /**
   * Identifiant unique de la liste déjà existante, null si la liste est à créer
   *
   * @readonly
   * @type {string}
   * @memberof ListEditPage
   */
  public readonly listUUID: string;

  private listSub: Subscription;

  /**
   * Type de la liste en cours d'édition
   *
   * @private
   * @type {ListType}
   * @memberof ListEditPage
   */
  private listType: ListType;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of ListEditPage.
   * @param {NavController} navCtrl
   * @param {AlertController} alertCtrl
   * @param {LoadingController} loadingCtrl
   * @param {Events} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {ToastController} toastCtrl
   * @param {FormBuilder} formBuilder
   * @param {TodoServiceProvider} todoService
   * @param {NavParams} navParams
   * @param {AuthServiceProvider} authCtrl
   * @memberof ListEditPage
   */
  constructor(
    public readonly navCtrl: NavController,
    public readonly alertCtrl: AlertController,
    public readonly loadingCtrl: LoadingController,
    public readonly evtCtrl: Events,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly formBuilder: FormBuilder,
    private readonly todoService: TodoServiceProvider,
    private readonly navParams: NavParams
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
    this.listUUID = this.navParams.get('uuid');
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
    const header = Global.VALIDABLE_PAGE_DATA;

    if (this.listUUID != null) {
      this.defineEditList(header);
    } else {
      header.title = 'Nouvelle Liste';
      Global.HEADER = header;
    }
  }

  ionViewWillExit() {
    this.tryUnSub(this.listSub);
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @param {MenuRequest} req
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

    if (!this.authCtrl.isConnected()) {
      this.newList.get('local').disable();
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

    let local = false;
    if (this.listType === ListType.LOCAL) {
      local = true;
    }

    let todoList = await this.todoService.getAList(this.listUUID);

    try {
      todoList = await this.todoService.getAList(this.listUUID);
    } catch (error) {
      console.log(
        '[ListEditPage] list not found, assuming logout & redirect, ignoring... '
      );
      todoList = Observable.of(Global.BLANK_LIST);
    }

    this.listSub = todoList.subscribe(list => {
      header.title = 'Editer "' + list.name + '" ';
      Global.HEADER = header;
      this.newList = this.formBuilder.group({
        name: [list.name, Validators.required],
        icon: [list.icon, Validators.required],
        local: [local, Validators.required]
      });

      if (this.listType === ListType.SHARED) {
        this.newList.get('local').disable();
      }
    });
  }

  private async updateList(): Promise<void> {
    this.showLoading('Mise à jour de la liste...');

    let destType: ListType = this.listType;

    if (
      this.authCtrl.isConnected() &&
      this.newList.get('local') != null &&
      this.listType !== ListType.SHARED
    ) {
      if (this.newList.get('local').value === true) {
        destType = ListType.LOCAL;
      } else {
        destType = ListType.PRIVATE;
      }
    }

    await this.todoService.updateList(
      {
        uuid: this.listUUID,
        name: this.newList.value.name,
        items: [],
        icon: this.newList.value.icon
      },
      destType
    );
    this.navCtrl.pop();
    this.navCtrl.pop();
    this.navCtrl.push(TodoListPage, { uuid: this.listUUID });
  }

  /**
   * Permet de créer une nouvelle liste
   * et de l'associer au compte courrant (si spécifié et si possible)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof ListEditPage
   */
  private async defineList(): Promise<void> {
    this.showLoading('Création de la liste...');

    let destType: ListType = ListType.LOCAL;

    if (
      this.authCtrl.isConnected() &&
      this.newList.get('local') != null &&
      this.newList.get('local').value === false
    ) {
      destType = ListType.PRIVATE;
    }

    const nextUuid = await this.todoService.addList(
      {
        uuid: null,
        name: this.newList.value.name,
        items: [],
        icon: this.newList.value.icon
      },
      destType
    );
    this.navCtrl.pop();
    this.navCtrl.push(TodoListPage, { uuid: nextUuid });
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

  get localChoice(): boolean {
    return this.authCtrl.isConnected() && this.listType !== ListType.SHARED;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  public defList(): void {
    if (this.newList.valid) {
      if (this.listUUID == null) {
        this.defineList();
      } else {
        this.updateList();
      }
    } else {
      this.alert(
        'Opération Impossible',
        "Veuillez vérifier d'avoir renseignée toutes les données"
      );
    }
  }
}
