import { QrcodeGeneratePage } from './../list-sharer/qrcode-generate/qrcode-generate';
import { PageData } from './../../model/page-data';
import { Global } from './../../shared/global';
import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  NavController,
  NavParams,
  LoadingController
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoItem } from './../../model/todo-item';
import { TodoList } from './../../model/todo-list';
import { TodoEditPage } from './../todo-edit/todo-edit';
import { EventServiceProvider } from '../../providers/event/event-service';
import { Subscription } from 'rxjs';
import { MenuRequest } from '../../model/menu-request';
import { GenericPage } from '../../shared/generic-page';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { ListEditPage } from '../list-edit/list-edit';
import { Media } from '../../model/media';

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

  /**
   * Creates an instance of TodoListPage.
   * @param {NavController} navCtrl
   * @param {LoadingController} loadingCtrl
   * @param {AlertController} alertCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoService
   * @param {NavParams} navParams
   * @memberof TodoListPage
   */
  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    private todoService: TodoServiceProvider,
    private navParams: NavParams
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl);
    this.listUUID = navParams.get('uuid');
    this.todoItems = Observable.of([]);
  }

  private initDataList(pageData: PageData): void {
    const listType = this.todoService.getListType(this.listUUID);
    this.todoList = this.todoService.getAList(this.listUUID, listType);
    this.listeSub = this.todoList.subscribe(res => {
      pageData.title = 'Liste "' + res.name + '"';
      this.evtCtrl.getHeadeSubject().next(pageData);
    });
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter() {
    const pageData = Global.DEFAULT_PAGE_DATA;
    this.initDataList(pageData);
  }

  ionViewWillLeave() {
    if (this.listeSub != null) {
      this.listeSub.unsubscribe();
    }
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
