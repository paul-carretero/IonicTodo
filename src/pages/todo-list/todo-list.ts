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
import { TodoList } from './../../model/todo-list';
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
   * La liste de todo en observable
   *
   * @type {Observable<TodoList>}
   * @memberof TodoListPage
   */
  public todoList: Observable<TodoList>;

  /**
   * Les todo de cette liste en observable
   *
   * @type {Observable<TodoItem[]>}
   * @memberof TodoListPage
   */
  public todoItems: Observable<TodoItem[]>;

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
    private authCtrl: AuthServiceProvider,
    private todoService: TodoServiceProvider,
    private navParams: NavParams
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl);
    this.listUUID = this.navParams.get('uuid');
    this.todoItems = Observable.of([]);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter() {
    const pageData = Global.SHARE_EDIT_PAGE_DATA;
    this.initDataList(pageData);
  }

  ionViewWillLeave() {
    if (this.listeSub != null) {
      this.listeSub.unsubscribe();
    }
  }

  /**************************************************************************/
  /************************ METHODE INTERNES/PRIVATE ************************/
  /**************************************************************************/

  private initDataList(pageData: PageData): void {
    const listType = this.todoService.getListType(this.listUUID);
    this.todoList = this.todoService.getAList(this.listUUID, listType);
    this.listeSub = this.todoList.subscribe(res => {
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
