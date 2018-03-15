import { IAuthor } from './../../model/author';
import { NfcSenderPage } from './../list-sender/nfc-sender/nfc-sender';
import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  NavParams,
  ToastController
} from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';

import { Media } from '../../model/media';
import { IMenuRequest } from '../../model/menu-request';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { ListEditPage } from '../list-edit/list-edit';
import { IPageData } from './../../model/page-data';
import { ITodoItem } from './../../model/todo-item';
import { ITodoList, ListType } from './../../model/todo-list';
import { Global } from './../../shared/global';
import { QrcodeGeneratePage } from './../list-sender/qrcode-generate/qrcode-generate';
import { TodoEditPage } from './../todo-edit/todo-edit';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { MenuRequestType } from '../../model/menu-request-type';
import { CloudSenderPage } from '../list-sender/cloud-sender/cloud-sender';

@IonicPage()
@Component({
  selector: 'page-todo-list',
  templateUrl: 'todo-list.html'
})
export class TodoListPage extends GenericPage {
  /**
   * Identifiant unique d'une liste
   *
   * @private
   * @type {string}
   * @memberof TodoListPage
   */
  private readonly listUUID: string;

  /**
   * Subscription pour update sur cette liste
   *
   * @private
   * @type {Subscription}
   * @memberof TodoListPage
   */
  private listeSub: Subscription;

  /**
   * Les todo de cette liste en observable
   *
   * @type {Observable<TodoItem[]>}
   * @memberof TodoListPage
   */
  public readonly todoItems: Observable<ITodoItem[]>;

  public listAuthor: IAuthor;

  private readonly listType: ListType;

  public editable: boolean = true;

  public displayInfo: boolean = false;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  constructor(
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly todoService: TodoServiceProvider,
    private readonly navParams: NavParams
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
    this.listUUID = this.navParams.get('uuid');
    this.todoItems = Observable.of([]);
    this.listType = this.todoService.getListType(this.listUUID);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter() {
    const pageData = Global.getShareEditPageData();
    this.initDataList(pageData);
  }

  ionViewWillLeave() {
    this.tryUnSub(this.listeSub);
  }

  /**************************************************************************/
  /************************ METHODE INTERNES/PRIVATE ************************/
  /**************************************************************************/

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
      console.log(
        '[TodoListPage] list not found, assuming logout & redirect, ignoring... '
      );
      todoList = Observable.of(Global.BLANK_LIST);
    }

    this.listeSub = todoList.subscribe((res: ITodoList) => {
      pageData.title = 'Liste "' + res.name + '"';
      this.evtCtrl.getHeadeSubject().next(pageData);
      this.listAuthor = res.author;
    });
  }

  private async importList(): Promise<void> {
    this.showLoading('Import de la liste en cours');
    const list: ITodoList = this.todoService.getAListSnapshot(this.listUUID);
    await this.todoService.addList(list, ListType.PRIVATE);
    this.todoService.removeListLink(this.listUUID);
    this.navCtrl.popToRoot();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   *
   * @override
   * @param {IMenuRequest} req
   * @memberof TodoListPage
   */
  public menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.DELETE: {
        this.todoService.deleteList(this.listUUID);
        this.navCtrl.popToRoot();
        break;
      }
      case MenuRequestType.EDIT: {
        this.navCtrl.push(ListEditPage, { uuid: this.listUUID });
        break;
      }
      case MenuRequestType.IMPORT: {
        this.importList();
        break;
      }
      case MenuRequestType.SEND: {
        switch (req.media) {
          case Media.QR_CODE:
            this.navCtrl.push(QrcodeGeneratePage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SEND, media: Media.QR_CODE }
            });
            break;
          case Media.NFC:
            this.navCtrl.push(NfcSenderPage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SEND, media: Media.NFC }
            });
            break;
          case Media.CLOUD:
            this.navCtrl.push(CloudSenderPage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SEND, media: Media.CLOUD }
            });
            break;
        }
        break;
      }
      case MenuRequestType.SHARE: {
        switch (req.media) {
          case Media.QR_CODE:
            this.navCtrl.push(QrcodeGeneratePage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.QR_CODE }
            });
            break;
          case Media.NFC:
            this.navCtrl.push(NfcSenderPage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.NFC }
            });
            break;
          case Media.CLOUD:
            this.navCtrl.push(CloudSenderPage, {
              uuid: this.listUUID,
              request: { request: MenuRequestType.SHARE, media: Media.CLOUD }
            });
            break;
        }
        break;
      }
    }
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public loginAuthRequired(): boolean {
    return this.listType === ListType.PRIVATE || this.listType === ListType.SHARED;
  }

  public basicAuthRequired(): boolean {
    return true;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  public deleteTodo(todoUUID: string): void {
    this.todoService.deleteTodo(this.listUUID, todoUUID);
  }

  public selectTodo(todoUUID: string): void {
    this.navCtrl.push(TodoEditPage, {
      todoUUID: todoUUID,
      listUUID: this.listUUID
    });
  }

  public completeCheck(todo: ITodoItem): void {
    if (todo.complete === false) {
      this.todoService.complete(this.listUUID, todo.uuid, true);
    } else {
      this.todoService.complete(this.listUUID, todo.uuid, false);
    }
  }

  public createTodo(): void {
    this.navCtrl.push(TodoEditPage, {
      todoUUID: null,
      listUUID: this.listUUID
    });
  }
}
