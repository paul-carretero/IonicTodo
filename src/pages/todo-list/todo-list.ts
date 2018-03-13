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
import { MenuRequest } from '../../model/menu-request';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { ListEditPage } from '../list-edit/list-edit';
import { PageData } from './../../model/page-data';
import { TodoItem } from './../../model/todo-item';
import { TodoList, ListType } from './../../model/todo-list';
import { Global } from './../../shared/global';
import { QrcodeGeneratePage } from './../list-sender/qrcode-generate/qrcode-generate';
import { TodoEditPage } from './../todo-edit/todo-edit';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

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
  private listUUID: string;

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
  public todoItems: Observable<TodoItem[]>;

  private listType: ListType;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public toastCtrl: ToastController,
    public authCtrl: AuthServiceProvider,
    private todoService: TodoServiceProvider,
    private navParams: NavParams
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
    const pageData = Global.SHARE_EDIT_PAGE_DATA;
    this.initDataList(pageData);
  }

  ionViewWillLeave() {
    this.tryUnSub(this.listeSub);
  }

  /**************************************************************************/
  /************************ METHODE INTERNES/PRIVATE ************************/
  /**************************************************************************/

  private async initDataList(pageData: PageData): Promise<void> {
    let todoList: Observable<TodoList>;
    try {
      todoList = await this.todoService.getAList(this.listUUID);
    } catch (e) {
      console.log(
        '[TodoListPage] list not found, assuming logout & redirect, ignoring... '
      );
      todoList = Observable.of(Global.BLANK_LIST);
    }

    this.listeSub = todoList.subscribe((res: TodoList) => {
      pageData.title = 'Liste "' + res.name + '"';
      this.evtCtrl.getHeadeSubject().next(pageData);
    });
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   *
   * @override
   * @param {MenuRequest} req
   * @memberof TodoListPage
   */
  public menuEventHandler(req: MenuRequest): void {
    switch (req) {
      case MenuRequest.DELETE: {
        this.todoService.deleteList(this.listUUID);
        this.navCtrl.popToRoot();
        break;
      }
      case MenuRequest.EDIT: {
        this.navCtrl.push(ListEditPage, { uuid: this.listUUID });
        break;
      }
      case MenuRequest.SEND: {
        switch (this.evtCtrl.getMedia()) {
          case Media.QR_CODE:
            this.navCtrl.push(QrcodeGeneratePage, {
              uuid: this.listUUID,
              request: MenuRequest.SEND
            });
            break;
        }
        break;
      }
      case MenuRequest.SHARE: {
        switch (this.evtCtrl.getMedia()) {
          case Media.QR_CODE:
            this.navCtrl.push(QrcodeGeneratePage, {
              uuid: this.listUUID,
              request: MenuRequest.SHARE
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

  public completeCheck(todo: TodoItem): void {
    if (todo.complete == false) {
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
